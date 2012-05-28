var OMLoader = require('../lib/openmultimedia.node-library/OMLoader.js');

var Inheritance = OMLoader.require('base/Inheritance.js');
var AbstractConfig = OMLoader.require('base/AbstractConfig.js');

var ServerConfig = OMLoader.require('server/ServerConfig.js');
var MongoDBConfig = OMLoader.require('db/MongoDBConfig.js');
var UploaderConfig = OMLoader.require('uploader/UploaderConfig.js');

function UploadServiceConfig(opt_options) {
    console.log('Running: UploadService');

    Inheritance.parentConstructorApply(this, UploadServiceConfig, [ opt_options ]);
}

Inheritance.inherits(UploadServiceConfig, AbstractConfig);

UploadServiceConfig.prototype.initializeFields = function UploadServiceConfig_initializeFields() {
    console.log('Running: UploadServiceConfig_initializeFields');

    Inheritance.parentMethodApply(this, UploadServiceConfig, 'initializeFields');

    this.fields_['server'] = new ServerConfig();

    this.fields_['uploader'] = new UploaderConfig();

    this.fields_['db'] = new MongoDBConfig();

    console.log( "UploaderServiceFields");
};

module.exports = UploadServiceConfig;
