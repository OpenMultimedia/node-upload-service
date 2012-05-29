var OMLoader = global.OMLoader;

var Inheritance = OMLoader.require('base/Inheritance.js');
var MongoDBConfig = OMLoader.require('db/MongoDBConfig.js');
var AbstractConfig = OMLoader.require('base/AbstractConfig.js');
var FilesizeUnit = OMLoader.require('base/FilesizeUnit.js');

function FilesApiConfig(opt_options) {
    Inheritance.parentConstructorApply(this, FilesApiConfig, [ opt_options ]);
}

Inheritance.inherits( FilesApiConfig, AbstractConfig );

FilesApiConfig.prototype.initializeFields = function FilesApiConfig_initializeFields() {
    Inheritance.parentMethodApply(this, FilesApiConfig,  'initializeFields');

    this.fields_['db'] = new MongoDBConfig();

    this.fields_['upload_location']  = '../uploads';

    this.fields_['size_limit']  = 100 * FilesizeUnit.Megabyte;

    this.fields_['debug'] = false,
    this.fields_['valid_formats'] = [ 'mp4', 'avi', 'mov' ]
};

module.exports = FilesApiConfig;
