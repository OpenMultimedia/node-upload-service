#!/usr/bin/env node

/********** Pre-initialize process ********/

// Cambio al directorio actual del script
process.chdir(__dirname);

/********** Libraries ********/

// Inicialización del Loader Global de la biblioteca de componentes OpenMultimedia
global.OMLib = require('./lib/openmultimedia.node-library');

/** @type {http} */
var http = require('http');

/** @type {http} */
var https = require('https');

/** @type {path} */
var path = require('path');

/** @type {fs} */
var fs = require('fs');

var omprocess = OMLib.require('process');

/********** Classes ********/

// Inicialización de la configuración del Servicio de Uploads
var UploadServiceConfig = require('./app-lib/UploadServiceConfig.js');

/******** Initialization process **********/
for ( var i = 2; i < process.argv.length; i += 1 ) {
    if ( process.argv[i] == '--profile' ) {
        nodetime.profile();
        break;
    }
}

var uploadServiceConfig = new UploadServiceConfig();

try {
    if ( path.existsSync('app-config.json') ) {
        var configFile = fs.readFileSync('app-config.json');
        if ( configFile ) {
            uploadServiceConfig.setOptions(JSON.parse(configFile));
        }
    }
} catch (err) {
    console.error("Error cargando el archivo de configuración del servicio: %s", err);
    process.exit();
}

// Inicialización del Servidor de contenido estático

var node_static = require('./lib/node-static');

var staticServer;

if ( uploadServiceConfig.public_dir ) {
    staticServer = new node_static.Server( uploadServiceConfig.public_dir );
}

// Inicialización del Manejador del API

var ApiManager = require('./app-lib/api/ApiManager.js');

var apiManager = new ApiManager(uploadServiceConfig.get('api'));

if ( staticServer ) {
    apiManager.addListener('invalid_api_endpoint',
        function onApiControllerNotFound ( request, response ) {
            staticServer.serve(request, response, function (e, res) {
                if (e && (e.status === 404)) { // If the file wasn't found
                    response.writeHead(404);
                    response.end('File Not Found');
                    //TODO: Define custom error pages ?
                    //staticServer.serveFile('/not-found.html', request, response);
                }
            });
        }
    );
}

function ManageRequestWrapper (request,  response) {
    apiManager.manageRequest(request, response);
};

/** @type {http.Server|https.Server} */
var server;

if ( uploadServiceConfig.server.ssl ) {
    var sslOptions = {
        key: uploadServiceConfig.server.key ? fs.readFileSync(uploadServiceConfig.server.key) : '',
        cert: uploadServiceConfig.server.cert ? fs.readFileSync(uploadServiceConfig.server.cert) : ''
    };

    server = https.createServer( sslOptions, ManageRequestWrapper );

} else {
    server = http.createServer( ManageRequestWrapper );
}

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
