#!/usr/bin/env node

/********** Pre-initialize process ********/

// Cambio al directorio actual del script
process.chdir(__dirname);

/********** Libraries ********/

// Inicialización del Loader Global de la biblioteca de componentes OpenMultimedia
global.OMLib = require('./lib/openmultimedia.node-library');

// Sub-Biblioteca para tareas del proceso Node
var omprocess = OMLib.require('process');

/** @type {http} */
var http = require('http');

/** @type {http} */
var https = require('https');

/** @type {path} */
var path = require('path');

/** @type {fs} */
var fs = require('fs');

/** Submodulo para servir contenido estático */
var node_static = require('./lib/node-static');

/********** Classes ********/

// Inicialización de la configuración del Servicio de Uploads
var UploadServiceConfig = require('./app-lib/UploadServiceConfig.js');

/********* Globales y estáticos *******/

var uploadServiceConfig = new UploadServiceConfig();

var staticServer = null;

var apiManager;

/** @type {http.Server|https.Server} */
var server;

/******** Initialization process **********/

function loadConfig (file) {
    try {
        if ( path.existsSync(file) ) {
            var configFile = fs.readFileSync(file);
            if ( configFile ) {
                uploadServiceConfig.setOptions(JSON.parse(configFile));
            }
        } else {
            console.error("El archivo de configuración: %s no existe", file);
            process.exit(-1);
        }
    } catch (err) {
        console.error("Error cargando el archivo de configuración: %s (%s)", file, err);
        process.exit(-1);
    }
}

function runProfiling () {
    var nodetime;

    try {
        nodetime = require('nodetime');
    } catch (e) {
        console.error('Error al requerir nodetime, ¿Está instalado?.: %s', e);
        process.exit(-1);
    }

    nodetime.profile();
}

for ( var i = 2; i < process.argv.length; i += 1 ) {
    var argParts = process.argv[i].split('=');

    switch ( argParts[0] ) {
        case '--profile':
            runProfiling();
            break;
        case '--config':
            loadConfig(argParts[1]);
            break;
    }
}

// Se inicializa el servidor de contenido estático

if ( uploadServiceConfig.public_dir ) {
    staticServer = new node_static.Server( uploadServiceConfig.public_dir );
}

// Inicialización del Manejador del API

var ApiManager = require('./app-lib/api/ApiManager.js');
apiManager = new ApiManager(uploadServiceConfig.api);

/* Se liga el servidor de contenido estático con el ApiManager*/

apiManager.addListener('invalid_api_endpoint', function onApiControllerNotFound ( request, response ) {
    function serve404() {
        response.writeHead(404);
        response.end('File Not Found');
    }

    function serve500() {
        response.writeHead(500);
        response.end('Server error');
    }

    if ( staticServer ) {
        staticServer.serve(request, response, function (e, res) {
            if (e && (e.status === 404)) {
                serve404();
                //TODO: Define custom error pages ?
                //staticServer.serveFile('/not-found.html', request, response);
            } else {
                serve500();
            }
        });
    } else {
        serve400();
    }
});

// Wrapper para la llamada al ApiManager a partir de la request al servidor
function ManageRequestWrapper (request,  response) {
    apiManager.manageRequest(request, response);
};

// Creación del servidor web
if ( uploadServiceConfig.server.ssl ) {
    var sslOptions = {
        key: uploadServiceConfig.server.key ? fs.readFileSync(uploadServiceConfig.server.key) : '',
        cert: uploadServiceConfig.server.cert ? fs.readFileSync(uploadServiceConfig.server.cert) : ''
    };

    server = https.createServer( sslOptions, ManageRequestWrapper );
} else {
    server = http.createServer( ManageRequestWrapper );
}

// Verificación de permisos
if ( uploadServiceConfig.server.port < 1024 && ! omprocess.isRoot() ) {
    console.error('Para escuchar en un puerto privilegiado (< 1024) se requiere ejecución como root');
    process.exit(-1);
}

server.on('error', function(err) {
    switch ( err ) {
        case 'EACCES':
            console.error('Error al escuchar en %s:%s', uploadServiceConfig.server.address, uploadServiceConfig.server.port);
            process.exit(-1);
            break;
    }

    console.warn('Error del servidor: %s', err);
});

server.listen(uploadServiceConfig.server.port, uploadServiceConfig.server.address, function() {
    if ( ! omprocess.dropPrivileges(uploadServiceConfig.process.uid, uploadServiceConfig.process.gid) ) {
        console.error('Ha ocurrido un error al reducir los permisos de ejecución');
        process.exit(-1);
    }

    console.log('Running Node Server on %s:%s (SSL %s)', uploadServiceConfig.server.address, uploadServiceConfig.server.port, uploadServiceConfig.server.ssl ? 'Activado' : 'Desactivado');
});
