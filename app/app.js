#!/usr/bin/env node

// Cambio al directorio actual del script
process.chdir(__dirname );

/** @type {HTTP} */
var http = require('http');

var path = require('path');

var fs = require('fs');

var mongodb = require('mongodb');

var url = require('url');

var OMLoader =  require('./lib/openmultimedia.node-library/OMLoader.js');

var UploadServiceConfig = require('./app/UploadServiceConfig.js');

var config = new UploadServiceConfig();

var node_static = require('./lib/node-static');

if ( path.existsSync('config.json') ) {
    var configFile = fs.readFileSync('config.json');
    if ( configFile ) {
        config.setOptions(JSON.parse(configFile));
    }
}

var staticServer = new node_static.Server('../public/');

/** @type {http.Server} */
var server = http.createServer(
    /**
     * Procesa la subida
     * @param {http.ServerRequest} request
     * @param {http.ServerResponse} response
     */
    function(request, response) {
        console.log('Connection received.');

        var currentUrl = url.parse(request.url, true);

        if ( currentUrl.pathname == '/files/' ) {

            switch ( request.method ) {
                case 'GET':
                    response.write('Dawnload!!');
                    break;

                case 'PUT':
                case 'POST':
                    response.write('Uploaddd!!');
                    break;

                case 'DELETE':
                    response.write('Deleteee!!');
                    break;

                default:
                    response.write('???');
            }

            response.end();
        } else {
            //bouncy.bounce(88, 'static-upload.openmultimedia.dev');
            staticServer.serve(request, response);
        }

        return;

        response.writeHead(200, {'Content-Type': 'text/html'});

        console.log("Processing file");

        //new mongo.Db('upload_service');

        var outputBuffer = fs.createWriteStream('temp', { flags: 'w', encoding: null, mode: ( 0x10 * 0x6 + 0x8 * 0x6 + 0x6 ) });

        var peakMem = 0;

        request.pipe(outputBuffer);

        request.addListener('data',
            /**
             * @param {Buffer} dataBuffer;
             */
            function(dataBuffer) {
                //outputBuffer.write(dataBuffer);

                var theMem = process.memoryUsage().rss;

                console.log("Memory: MB", theMem / (1024 * 1024));

                if ( theMem > peakMem ) {
                    peakMem = theMem;
                }
            }
        );

        request.addListener('end', function() {
            outputBuffer.end();
            console.log('Peak mem: ', peakMem / (1024 * 1024));
            response.end();
        });

        response.write('<html><body>Hio telesur</body></html>');
    }
);

var serverPort = config.get('server').get('port');

var serverAddress = config.get('server').get('address');

server.listen(serverPort, serverAddress);

console.log('Running Node Server on ' + serverAddress + ':' + serverPort );
