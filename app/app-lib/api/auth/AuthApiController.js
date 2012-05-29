var OMLoader = global.OMLoader;

var Inheritance = OMLoader.require('base/Inheritance.js');

var AuthApiConfig = require('./AuthApiConfig.js');

var AbstractApiController = require('../AbstractApiController.js');

function AuthApiController(opt_config) {

}

Inheritance.inherits(AuthApiController, AbstractApiController);

module.exports = AuthApiController;
