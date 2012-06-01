var OMLib = global.OMLib;
var oop = OMLib.require('oop');

var MongoDBConfig = OMLib.require('db/MongoDBConfig.js');
var AbstractConfig = OMLib.require('AbstractConfig.js');
var FilesizeUnit = OMLib.require('util/FilesizeUnit.js');

function FilesApiConfig(opt_options) {
    oop.super(FilesApiConfig).constructor.apply(this, [ opt_options ]);
}

module.exports = FilesApiConfig;

oop.inherits(FilesApiConfig, AbstractConfig);

FilesApiConfig.prototype.initializeFields = function FilesApiConfig_initializeFields() {

    oop.super(FilesApiConfig).initializeFields.apply(this);

    this.fields_['db'] = new MongoDBConfig();

    this.fields_['upload_location']  = '../uploads';

    this.fields_['size_limit']  = 100 * FilesizeUnit.Megabyte;

    this.fields_['debug'] = false,

    this.fields_['valid_formats'] = [ 'mp4', 'avi', 'mov' ]
};
