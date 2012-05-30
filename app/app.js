#!/usr/bin/env node

for ( var i = 2; i < process.argv.length; i += 1 ) {
    if ( process.argv[i] == '--profile' ) {
        var nodetime = require('../../../public/nodetime/');
        nodetime.profile();
        break;
    }
}

/** @type {http} */
var http = require('http');

/** @type {path} */
var path = require('path');

/** @type {fs} */
var fs = require('fs');

// Cambio al directorio actual del script
process.chdir(__dirname);

// Inicialización del Loader Global de la biblioteca de componentes OpenMultimedia
global.OMLoader = require('./lib/openmultimedia.node-library/OMLoader.js');

// Inicialización de la configuración del Servicio de Uploads

var UploadServiceConfig = require('./app-lib/UploadServiceConfig.js');

var config = new UploadServiceConfig();

if ( path.existsSync('app-config.json') ) {
    var configFile = fs.readFileSync('app-config.json');
    if ( configFile ) {
        config.setOptions(JSON.parse(configFile));
    }
}

// Inicialización del Servidor de contenido estático

var node_static = require('./lib/node-static');

var staticServer = new node_static.Server('../public/');

// Inicialización del Manejador del API

var ApiManager = require('./app-lib/api/ApiManager.js');

var apiManager = new ApiManager(config.get('api'));

apiManager.addListener('invalid_api_endpoint',
    function onApiControllerNotFound ( request, response ) {
        staticServer.serve(request, response);
    }
);

/** @type {http.Server} */
var server = http.createServer(
    /**
     * Procesa la subida
     * @param {http.ServerRequest} request
     * @param {http.ServerResponse} response
     */
    function(request, response) {
        console.log('Processing request');

        apiManager.manageRequest( request, response );
    }
);

var serverPort = config.get('server').get('port');
var serverAddress = config.get('server').get('address');

server.listen(serverPort, serverAddress);

console.log('Running Node Server on ' + serverAddress + ':' + serverPort );
