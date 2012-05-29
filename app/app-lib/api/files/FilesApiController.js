var OMLoader = global.OMLoader;

var Inheritance = OMLoader.require('base/Inheritance.js');

var FilesApiConfig = require('./FilesApiConfig.js');

var AbstractApiController = require('../AbstractApiController.js');

var path = require('path');
var fs = require('fs');

function FilesApiController (opt_config) {
    if ( opt_config && Inheritance.instanceOf(this, FilesApiConfig) ) {
        this.config_ = opt_config;
    } else {
        this.config_ = new FilesApiConfig(opt_config);
    }

    Inheritance.parentConstructorApply(this, FilesApiController);
}

Inheritance.inherits(FilesApiController, AbstractApiController);

FilesApiController.prototype.serve = function FilesApiController_serve (path, params, request, response) {
    switch (  request.method ) {
        case 'GET':
            this.serveGet( path, params, request, response );
            break;
        case 'POST':
        case 'PUT':
            this.servePost( path, params, request, response );
            break;
        case 'DELETE':
            this.serveDelete( path, params, request, response);
            break;
        default:
            console.log('Invalid Method: %s', request.method);
            this.serveError( 503, 'invalid_request', request, response );
            break;
    }
};

FilesApiController.prototype.serveGet = function FilesApiController_serveGet ( path, params, request, response ) {
    console.log("Serving GEt");
    var pathPieces = this.splitPath(path);

    if ( pathPieces.length == 1 ) {
        // Serve: GET /<file-id>/
        this.serveFileDownload( pathPieces[0] );
    } else if ( (pathPieces.length == 2) && (pathPieces[1] == 'info') ) {
        // Serve: GET /<file-id>/info/
        this.serveFileInfo( pathPieces[0] );
    } else {
        // Serve anything else
        this.serveError( 503, 'invalid_request', request, response );
    }
};

FilesApiController.prototype.servePost = function FilesApiController_servePost ( path, params, request, response  ) {
    var pathPieces = this.splitPath(path);

    console.log("Serving post: %j", pathPieces);

    if ( pathPieces.length == 0 ) {
        this.serveFileUpload( '',  params, request, response );
    } else if ( pathPieces.length == 1 && params['overwrite'] ) {
        this.serveFileUpload( pathPieces[0], params, request, response )
    } else {
        this.serveError(503, 'invalid_request', request, response);
        request.connection.destroy();
    }
};

FilesApiController.prototype.serveDelete = function FilesApiController_serveDelete ( path, params, request, response  ) {

};

FilesApiController.prototype.serveFileDownload = function FilesApiController_serveFileDownload ( fileid, params, request, response ) {

};

FilesApiController.prototype.serveFileInfo = function FilesApiController_serveFileInfo ( fileid, params, request, response ) {

};

FilesApiController.prototype.serveFileUpload = function FilesApiController_serveFileUpload ( fileid, params, request, response ) {
    console.log("Uploading file: " + request);

    var fileUploadResult = { 'success': true, 'id': 'temp' };

    var uploadPath = path.join( this.config_.get('upload_location'), 'temp');

    var outputBuffer = fs.createWriteStream(uploadPath, { flags: 'w', encoding: null, mode: ( 0x10 * 0x6 + 0x8 * 0x6 + 0x1 * 0x6 ) });

    request.pipe(outputBuffer);

    var self = this;

    request.addListener('end', function() {
        outputBuffer.end();

        self.serveJSON( 200, fileUploadResult, response );

        request.connection.destroy();
    });
};

FilesApiController.prototype.serveError = function FilesApiController_serveError ( httpErrorCode, errorCode, request, response ) {
    var errorObject = {
        'success': false,
        'error': errorCode
    };

    this.serveJSON( httpErrorCode, errorObject, response);
};

module.exports = FilesApiController;
