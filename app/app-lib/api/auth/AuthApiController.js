var OMLib = global.OMLib;
var oop = OMLib.require('oop');

var AbstractApiController = OMLib.require('api/AbstractApiController.js');

var AuthApiConfig = require('./AuthApiConfig.js');

function AuthApiController(opt_config) {
    if ( opt_config instanceof AuthApiConfig ) {
        this.config_ = opt_config;
    } else {
        this.config_ = new AuthApiConfig(opt_config);
    }

    oop.super(AuthApiController).constructor.apply(this);
}

module.exports = AuthApiController;

oop.inherits(AuthApiController, AbstractApiController);
