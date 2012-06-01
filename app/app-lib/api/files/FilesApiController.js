var OMLib = global.OMLib;
var oop = OMLib.require('oop');
var apiutil = OMLib.require('api/util')

var path = require('path');
var fs = require('fs');
var formidable = require('formidable');
var crypto = require('crypto');

var AbstractApiController = OMLib.require('api/AbstractApiController.js');
var FilesApiConfig = require('./FilesApiConfig.js');

var StatusCode = {
    Success: 'success'
}
var ErrorCode = {
    InvalidRequest: 'invalid_request',
    FileNotExists: 'file_not_exists',
    ServerError: 'server_error',
    SizeLimitExceeded: 'size_limit_exceeded',
    FileExists: 'file_exists',
    FileEmpty: 'file_empty'
}

function FilesApiController (opt_config) {
    if ( opt_config && (opt_config instanceof FilesApiConfig) ) {
        this.config_ = opt_config;
    } else {
        this.config_ = new FilesApiConfig(opt_config);
    }

    this.fileIdCont_ = 0;

    oop.super(FilesApiController).constructor.apply(this);
}

module.exports = FilesApiController;

oop.inherits(FilesApiController, AbstractApiController);

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
            this.serveError( 503, ErrorCode.InvalidRequest, request, response );
            break;
    }
};

FilesApiController.prototype.serveGet = function FilesApiController_serveGet ( path, params, request, response ) {
    var pathInfo = apiutil.splitResourcePath(path);

    console.log("Serving GET for %j", pathInfo);

    if ( pathInfo.parts.length == 1 ) {
        // Serve: GET /<file-id>/
        console.log("Serving File Download");
        this.serveFileDownload( pathInfo.parts[0], params, request, response );
    } else if ( (pathInfo.parts.length == 2) && (pathInfo.parts[1] == 'info') ) {
        // Serve: GET /<file-id>/info/
        console.log("Serving File Info");
        this.serveFileInfo( pathInfo.parts[0], params, request, response );
    } else {
        // Serve anything else
        console.log("Serving Invalid Request");
        this.serveError( 503, ErrorCode.InvalidRequest, request, response );
    }
};

FilesApiController.prototype.servePost = function FilesApiController_servePost ( path, params, request, response  ) {
    var pathInfo = apiutil.splitResourcePath(path);

    if ( pathInfo.parts.length == 0 ) {
        // Upload New File
        this.serveFileUpload( '',  params, request, response );
    } else if ( pathInfo.parts.length == 1 ) {
        //TODO: Considerar params['overwrite']

        // Overwrite or Resume File Upload
        this.serveFileUpload( pathInfo.parts[0], params, request, response )
    } else {
        // Request Invalid
        this.serveError(503, ErrorCode.InvalidRequest, request, response);
    }
};

FilesApiController.prototype.serveDelete = function FilesApiController_serveDelete ( path, params, request, response  ) {
    var pathInfo = apiutil.splitResourcePath(path);

    console.log("Serving DELETE for %s", path);

    if ( pathInfo.parts.length == 1 ) {
        // Serve: GET /<file-id>/
        console.log("Serving File Delete");
        this.serveFileDelete( pathInfo.parts[0], params, request, response );
    } else {
        // Serve anything else
        console.log("Serving Invalid Request");
        this.serveError( 503, ErrorCode.InvalidRequest, request, response );
    }
};

FilesApiController.prototype.serveFileDownload = function FilesApiController_serveFileDownload ( fileid, params, request, response ) {
    var self = this;

    var downloadPath = path.join( this.config_.get('upload_location'), fileid );

    path.exists( downloadPath, function(exists) {
        if ( ! exists ) {
            self.serveError(404, ErrorCode.FileNotExists, request, response);
            return;
        }

        fs.stat( downloadPath, function(err, stat) {
            if ( err ) {
                self.serveError(503, ErrorCode.ServerError, request, response);
                return;
            }

            if ( ! stat.isFile() ) {
                self.serveError(404, ErrorCode.FileNotFound, request, response);
                return;
            }

            var fileStream = fs.createReadStream(downloadPath);

            response.writeHead(200, {
                'Content-type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename=' + fileid,
                'Expires': '0',
                'Cache-Control': 'must-revalidate',
                'Pragma': 'public',
                'Content-Length': stat.size
            });

            fileStream.on('end', function() {
                response.end();
                request.connection.end();
            });

            console.log('Piping download');
            fileStream.pipe( response );
        });
    });
};

FilesApiController.prototype.serveFileInfo = function FilesApiController_serveFileInfo ( fileid, params, request, response ) {
    this.serveJSON(503, ErrorCode.InvalidRequest, request, response);
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
        this.serveError(503, ErrorCode.SizeLimitExceeded, request, response);
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
                self.serveError(503, ErrorCode.FileExists, request, response );
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
                self.serveError(503, ErrorCode.FileEmpty, request, response);
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

        self.serveError(503, ErrorCode.InvalidRequest, request, response);
    }
};

FilesApiController.prototype.serveFileDelete = function FilesApiController_serveFileDelete ( fileid, params, request, response ) {
    var self = this;
    var deletePath = path.join( this.config_.get('upload_location'), fileid );

    path.exists( deletePath, function(exists) {
        if ( ! exists ) {
            self.serveError(503, ErrorCode.FileNotExists, request, response);
            return;
        }

        fs.unlink( deletePath, function(err) {
            if ( err ) {
                self.serveError(503, ErrorCode.ServerError, request, response);
            } else {
                self.serveDeleteSuccess(fileid, request, response);
            }
        } );
    });
};

FilesApiController.prototype.servePostSuccess = function FilesApiController_servePostSuccess ( fileId, request, response ) {
    var successObject = {
        'success': true,
        'status': StatusCode.Success,
        'id': fileId
    };

    this.serveJSON( 200, successObject, response);

    request.connection.destroy();

    console.log('Request Success');
};

FilesApiController.prototype.serveDeleteSuccess = function FilesApiController_servePostSuccess ( fileId, request, response ) {
    var successObject = {
        'success': true,
        'status': StatusCode.Success,
        'id': fileId
    };

    this.serveJSON( 200, successObject, response);

    request.connection.destroy();

    console.log('Request Success');
};

FilesApiController.prototype.serveError = function FilesApiController_serveError ( httpErrorCode, errorCode, request, response ) {
    var errorObject = {
        'success': false,
        'status': StatusCode.Error,
        'error': errorCode
    };

    this.serveJSON( httpErrorCode, errorObject, response);

    request.connection.destroy();

    console.log('Request Error: ' + errorCode);
};
