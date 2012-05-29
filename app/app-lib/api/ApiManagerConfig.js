var OMLoader = global.OMLoader;

var Inheritance = OMLoader.require('base/Inheritance.js');
var AbstractConfig = OMLoader.require('base/AbstractConfig.js');

var FilesApiConfig = require('./files/FilesApiConfig.js');
var AuthApiConfig = require('./auth/AuthApiConfig.js');

function ApiManagerConfig() {
    Inheritance.parentConstructorApply(this, ApiManagerConfig);
};

Inheritance.inherits(ApiManagerConfig, AbstractConfig);

ApiManagerConfig.prototype.initializeFields = function ApiManagerConfig_initializeFields () {
    Inheritance.parentMethodApply(this, ApiManagerConfig, 'initializeFields');

    this.fields_['files'] = new FilesApiConfig();
    this.fields_['auth'] = new AuthApiConfig();
}

module.exports = ApiManagerConfig;
