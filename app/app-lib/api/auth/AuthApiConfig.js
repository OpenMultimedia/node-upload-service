var OMLoader = global.OMLoader;

var Inheritance = OMLoader.require('base/Inheritance.js');

var MongoDBConfig = OMLoader.require('db/MongoDBConfig.js');

var AbstractConfig = OMLoader.require('base/AbstractConfig.js');

function AuthApiConfig(opt_options) {
    Inheritance.parentConstructorApply(this, AuthApiConfig, [ opt_options ]);
}

Inheritance.inherits( AuthApiConfig, AbstractConfig );

AuthApiConfig.prototype.initializeFields = function AuthApiConfig_initializeFields() {
    Inheritance.parentMethodApply(this, AuthApiConfig,  'initializeFields');

    this.fields_['db'] = new MongoDBConfig();
};

module.exports = AuthApiConfig;
