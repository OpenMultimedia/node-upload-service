var OMLib = global.OMLib;
var util = require('util');

var AbstractConfig = OMLib.require('AbstractConfig.js');

var ServerConfig = OMLib.require('server/ServerConfig.js');
var ApiManagerConfig = require('./api/ApiManagerConfig.js');

function UploadServiceConfig(opt_options) {
    UploadServiceConfig.super_.apply(this, [ opt_options ]);
}

util.inherits(UploadServiceConfig, AbstractConfig);

UploadServiceConfig.prototype.initializeFields = function UploadServiceConfig_initializeFields() {
    UploadServiceConfig.super_.prototype.initializeFields.apply(this);

    this.fields_['server'] = new ServerConfig();
    this.fields_['api'] = new ApiManagerConfig();
    this.fields_['public_path'] = '../public';
};

module.exports = UploadServiceConfig;
