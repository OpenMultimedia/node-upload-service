var OMLib = global.OMLib;
var oop = OMLib.require('oop');

var MongoDBConfig = OMLib.require('db/MongoDBConfig.js');
var AbstractConfig = OMLib.require('AbstractConfig.js');

function AuthApiConfig(opt_options) {
    oop.super(AuthApiConfig).constructor.apply(this, [ opt_options ]);
}

module.exports = AuthApiConfig;

oop.inherits( AuthApiConfig, AbstractConfig );

AuthApiConfig.prototype.initializeFields = function AuthApiConfig_initializeFields() {
    oop.super(AuthApiConfig).initializeFields.apply(this);

    this.fields_['db'] = new MongoDBConfig();
};
