var OMLib = global.OMLib;
var oop = OMLib.require('oop');

var AbstractApiManager = OMLib.require('api/AbstractApiManager.js');

var ApiManagerConfig = require('./ApiManagerConfig.js');
var FilesApiController = require('./files/FilesApiController.js');
var AuthApiController = require('./auth/AuthApiController.js');

function ApiManager (opt_config) {
    oop.super(ApiManager).constructor.apply(this);

    if ( opt_config && ( opt_config instanceof ApiManagerConfig ) ) {
        this.config_ = opt_config;
    } else {
        this.config_ = new ApiManagerConfig(opt_config);
    }

    this.registerEndpoint_( '/files', new FilesApiController( this.config_.get('files') ) );
    this.registerEndpoint_( '/auth', new AuthApiController( this.config_.get('auth') ) );
};

module.exports = ApiManager;

oop.inherits(ApiManager, AbstractApiManager);
