var Inheritance = global.OMLoader.require('base/Inheritance.js');

var AbstractConfig = global.OMLoader.require('base/AbstractConfig.js');

var ApiManagerConfig = require('./api/ApiManagerConfig.js');

var ServerConfig = global.OMLoader.require('server/ServerConfig.js');

function UploadServiceConfig(opt_options) {
    Inheritance.parentConstructorApply(this, UploadServiceConfig, [ opt_options ]);
}

Inheritance.inherits(UploadServiceConfig, AbstractConfig);

UploadServiceConfig.prototype.initializeFields = function UploadServiceConfig_initializeFields() {
    Inheritance.parentMethodApply(this, UploadServiceConfig, 'initializeFields');

    this.fields_['server'] = new ServerConfig();
    this.fields_['api'] = new ApiManagerConfig();
};

module.exports = UploadServiceConfig;
