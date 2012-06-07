#!/bin/node

var OMLib = global.OMLib;
var oop = OMLib.require('oop');

var AbstractConfig = OMLib.require('AbstractConfig.js');

var FilesApiConfig = require('./files/FilesApiConfig.js');
var AuthApiConfig = require('./auth/AuthApiConfig.js');

function ApiManagerConfig() {
    oop.super(ApiManagerConfig).constructor.apply(this, []);
};

module.exports = ApiManagerConfig;

oop.inherits(ApiManagerConfig, AbstractConfig);

ApiManagerConfig.prototype.initializeFields = function ApiManagerConfig_initializeFields () {
    oop.super(ApiManagerConfig).initializeFields.apply(this);

    this.defineField('files', FilesApiConfig, new FilesApiConfig());
    this.defineField('auth', AuthApiConfig, new AuthApiConfig());
}
