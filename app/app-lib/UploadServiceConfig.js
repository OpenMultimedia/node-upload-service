var OMLib = global.OMLib;
var DataType = OMLib.require('util/DataType.js');
var util = require('util');

var AbstractConfig = OMLib.require('AbstractConfig.js');
var ProcessConfig = OMLib.require('process/ProcessConfig.js');

var ServerConfig = OMLib.require('server/ServerConfig.js');
var ApiManagerConfig = require('./api/ApiManagerConfig.js');

function UploadServiceConfig(opt_options) {
    UploadServiceConfig.super_.apply(this, [ opt_options ]);
}

util.inherits(UploadServiceConfig, AbstractConfig);

UploadServiceConfig.prototype.initializeFields = function UploadServiceConfig_initializeFields() {
    UploadServiceConfig.super_.prototype.initializeFields.apply(this);

    this.defineField('server', ServerConfig, new ServerConfig());
    this.defineField('api', ApiManagerConfig, new ApiManagerConfig());
    this.defineField('public_dir', DataType.String, '../public');
    this.defineField('process', ProcessConfig, new ProcessConfig());
};

module.exports = UploadServiceConfig;
