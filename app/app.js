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

if ( uploadServiceConfig.get('public_path') ) {
    staticServer = new node_static.Server( uploadServiceConfig.get('public_path') );
}

// Inicialización del Manejador del API

var ApiManager = require('./app-lib/api/ApiManager.js');

var apiManager = new ApiManager(uploadServiceConfig.get('api'));

if ( staticServer ) {
    apiManager.addListener('invalid_api_endpoint',
        function onApiControllerNotFound ( request, response ) {
            staticServer.serve(request, response);
        }
    );
}

function ManageRequestWrapper (request,  response) {
    apiManager.manageRequest(request, response);
};

/** @type {http.Server|https.Server} */
var server;

var serverConfig = uploadServiceConfig.get('server');

if ( serverConfig.get('ssl') ) {
    var sslOptions = {
        key: fs.readFileSync(serverConfig.get('key')),
        cert: fs.readFileSync(serverConfig.get('cert'))
    };

    server = https.createServer( sslOptions, ManageRequestWrapper );

} else {

    server = http.createServer( ManageRequestWrapper );
}

var serverPort = serverConfig.get('port');
var serverAddress = serverConfig.get('address');

server.listen(serverPort, serverAddress);

console.log('Running Node Server on %s:%s (SSL %s) ', serverAddress, serverPort, serverConfig.get('ssl') ? 'Activado' : 'Desactivado' );
