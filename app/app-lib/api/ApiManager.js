var ApiManagerConfig = require('./ApiManagerConfig.js');

var FilesApiController = require('./files/FilesApiController.js');

var AuthApiController = require('./auth/AuthApiController.js');

var Inheritance = global.OMLoader.require('base/Inheritance.js');

var events = require('events');

function ApiManager (opt_config) {

    if ( opt_config && Inheritance.instanceof(opt_config, ApiManagerConfig) ) {
        this.config_ = opt_config;
    } else {
        this.config_ = new ApiManagerConfig(opt_config);
    }

    this.apiEndpoints_ = [
        {
            path: 'files',
            controller: new FilesApiController( this.config_.get('files') )
        }, {
            path: 'auth',
            controller: new AuthApiController( this.config_.get('auth') )
        }
    ];
};

Inheritance.forceInherits(ApiManager, events.EventEmitter);

ApiManager.prototype.manageRequest = function ApiManager_manageRequest (request, response) {
    var url = require('url').parse(request.url, true);

    var controller;

    for ( var i =0; i < this.apiEndpoints_.length; i += 1 ) {
        var endpoint = this.apiEndpoints_[i];

        var regex = new RegExp('^/' + endpoint.path + '(/.*)?$', 'i');

        var matches = regex.exec( url.pathname );

        if ( matches != null ) {
            var resourcePath = ( matches[1] || '/' );
            var params = (url.query || {});

            endpoint.controller.serve( resourcePath, params, request, response );

            return;
        }
    }

    this.emit('invalid_api_endpoint', request, response);
};

module.exports = ApiManager;
