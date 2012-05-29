var url  = require('url');
var Inheritance = global.OMLoader.require('base/Inheritance');

function AbstractApiController () {
    Inheritance.abstractEnforce(this, AbstractApiController);
}

AbstractApiController.prototype.splitPath = function AbstractApiController_splitPath ( path ) {
    var pieces = path.split('/');
    var trailingSlash = ( path.lastIndexOf('/') == ( path.length - 1 ) );

    return ( pieces.slice(1, trailingSlash ? pieces.length - 2 : pieces.length - 1) );
};

AbstractApiController.prototype.serve = function AbstractApiController_serve ( path, params, request, response ) {
    Inheritance.abstractMethod();
}

AbstractApiController.prototype.serveJSON = function AbstractApiController_serveJSON (httpStatus, jsonObject, response) {
    var outputBuffer = new Buffer( JSON.stringify( jsonObject ) );

    var headers = {
        'Content-Length': outputBuffer.length,
        'Content-Type': 'application/json'
    };

    response.writeHead( httpStatus, headers );

    response.end( outputBuffer );
};

Inheritance.inheritable(AbstractApiController);

module.exports = AbstractApiController;
