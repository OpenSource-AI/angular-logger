'use strict';

var path = require('path');
var fs = require('fs');
var deepExtend = require('deep-extend');

var config = {
    karma : {
        browsers : ['PhantomJS'],
        reporters : ['coverage', 'progress'],
        port: 9888,
        captureTimeout: 60000
    },
    build : {
        minifyCode : true,
        failOnStyleErrors : true
    },
    server : {
        port : 9000
    }
};

var configFilePath = path.join(__dirname, '../', 'dev_config_overrides.json');
if(fs.existsSync(configFilePath)) {
    var fileConfig = require(configFilePath);
    if(fileConfig) {
        deepExtend(config, fileConfig);
    }
}

module.exports = config;
