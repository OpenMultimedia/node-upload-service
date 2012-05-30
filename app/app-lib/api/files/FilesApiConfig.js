var OMLoader = global.OMLoader;

var Inheritance = OMLoader.require('base/Inheritance.js');
var MongoDBConfig = OMLoader.require('db/MongoDBConfig.js');
var AbstractConfig = OMLoader.require('base/AbstractConfig.js');
var FilesizeUnit = OMLoader.require('base/FilesizeUnit.js');
var util = require('util');

function FilesApiConfig(opt_options) {
    FilesApiConfig.super_.apply(this, [ opt_options ]);
}

util.inherits(FilesApiConfig, AbstractConfig);

FilesApiConfig.prototype.initializeFields = function FilesApiConfig_initializeFields() {

    FilesApiConfig.super_.prototype.initializeFields.apply(this);

    this.fields_['db'] = new MongoDBConfig();

    this.fields_['upload_location']  = '../uploads';

    this.fields_['size_limit']  = 100 * FilesizeUnit.Megabyte;

    this.fields_['debug'] = false,

    this.fields_['valid_formats'] = [ 'mp4', 'avi', 'mov' ]
};

FilesApiConfig.prototype.setOptions = function (opt_options) {

    console.log('Setting %j', opt_options);

    FilesApiConfig.super_.prototype.setOptions.apply(this, [opt_options]);

}

module.exports = FilesApiConfig;
