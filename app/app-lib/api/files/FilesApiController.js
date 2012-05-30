var OMLoader = global.OMLoader;

var Inheritance = OMLoader.require('base/Inheritance.js');

var FilesApiConfig = require('./FilesApiConfig.js');

var AbstractApiController = require('../AbstractApiController.js');

var path = require('path');
var fs = require('fs');
var formidable = require('formidable');
var crypto = require('crypto');
var util = require('util');

function FilesApiController (opt_config) {
    if ( opt_config && (opt_config instanceof FilesApiConfig) ) {
        this.config_ = opt_config;
    } else {
        this.config_ = new FilesApiConfig(opt_config);
    }

    this.fileIdCont_ = 0;

    FilesApiController.super_.apply(this);
}

util.inherits(FilesApiController, AbstractApiController);

FilesApiController.prototype.makeFileId = function FilesApiController_makeFileId () {
    if ( this.fileIdCont_ >= 100 ) {
        this.fileIdCont_ = 0;
    }

    return crypto.createHash('md5').update( '#' + (new Date()).getTime() + '#' + this.fileIdCont_ ++ ).digest('hex');
};

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
        // Upload New File
        this.serveFileUpload( '',  params, request, response );
    } else if ( pathPieces.length == 1 ) {
        //TODO: Considerar params['overwrite']

        // Overwrite or Resume File Upload
        this.serveFileUpload( pathPieces[0], params, request, response )
    } else {
        // Request Invalid
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

    var contentType;
    if ( request.headers['content-type'] ) {
        contentType = request.headers['content-type'].split(';')[0];
    } else {
        contentType = '';
    }

    var contentLength = parseInt(request.headers['content-length'], 10);

    var self = this;

    if ( contentLength > this.config_.get('size_limit') ) {
        console.log("Req: %d > SL: %d", contentLength, this.config_.get('size_limit'));
        this.serveError(503, 'size_limit_exceeded', request, response);
        return;
    }

    var uploadedFileId = (fileid || this.makeFileId());

    var uploadPath = path.join( this.config_.get('upload_location'), uploadedFileId );
    var uploadPathTemp = uploadPath + '_temp';

    var overwrite = ( params && params['overwrite'] && ( params['overwrite'] == 1 ) )
    //TODO. Verificar permisos de sobreescritura

    var outputBuffer = fs.createWriteStream(uploadPathTemp, { flags: 'w', encoding: null, mode: ( 0x10 * 0x6 + 0x8 * 0x6 + 0x1 * 0x6 ) });

    function uploadEnd() {
        outputBuffer.end();

        path.exists( uploadPath, function(exists) {
            console.log('Exists %s: %i', uploadPath, exists);

            var canWriteFile = ( ! exists || overwrite );

            if ( ! canWriteFile ) {
                self.serveError(503, 'file_exists', request, response );
                return;
            } else {
                if ( exists ) {
                    fs.unlink( uploadPath, function() {
                        fs.rename( uploadPathTemp, uploadPath, function() {
                            self.servePostSuccess( uploadedFileId, request, response );
                        } )
                    } );
                } else {
                    fs.rename( uploadPathTemp, uploadPath, function() {
                        self.servePostSuccess( uploadedFileId, request, response );
                    } );
                }
            }
        });
    }

    if ( contentType === 'multipart/form-data' ) {
        // Se realiza una subida por POST Tradicional, se usa formidable para guardar el archivo

        console.log('Uploading Multipart Data');

        var form = formidable.IncomingForm();

        var fileReceived = false;

        form.onPart = function(part) {
            console.log('Receiving Part');

            if ( part.filename !== undefined ) {
                if ( ! fileReceived ) {
                    console.log('Receiving File');

                    part.on('data', function(data) {
                        form.pause();
                        outputBuffer.write(data, function() {
                            form.resume();
                        });
                    } );

                    part.on('end', uploadEnd);

                    fileReceived = true;
                } else {
                    console.log('File has been received');
                }
            }
        };

        form.on('end', function() {
            if ( ! fileReceived ) {
                self.serveError(503, 'file_empty', request, response);
            }
        });

        form.parse(request);

    } else if ( (contentType == 'application/octet-stream') || (contentType == '') ) {

        console.log('Uploading Stream Data');

        request.pipe(outputBuffer);

        request.on('end', function() {
            uploadEnd();
        });
    } else {
        // ContentType desconocido

        self.serveError(503, 'invalid_request', request, response);
    }
};

FilesApiController.prototype.serveError = function FilesApiController_serveError ( httpErrorCode, errorCode, request, response ) {
    var errorObject = {
        'success': false,
        'status': 'error',
        'error': errorCode
    };

    this.serveJSON( httpErrorCode, errorObject, response);

    request.connection.destroy();

    console.log('Request Error: ' + errorCode);
};

FilesApiController.prototype.servePostSuccess = function FilesApiController_servePostSuccess ( fileId, request, response ) {
    var successObject = {
        'success': true,
        'status': 'success',
        'id': fileId
    };

    this.serveJSON( 200, successObject, response);

    request.connection.destroy();

    console.log('Request Success');
};



module.exports = FilesApiController;
