var OMLib = global.OMLib;
var oop = OMLib.require('oop');
var DataType = OMLib.require('util/DataType.js');

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

    this.defineField('db', MongoDBConfig, new MongoDBConfig());
    this.defineField('upload_dir', DataType.String, '../uploads');
    this.defineField('size_limit', DataType.Number, 100 * FilesizeUnit.Megabyte);
    this.defineField('valid_formats', DataType.Array, [ 'mp4', 'avi', 'mov' ]);
};
