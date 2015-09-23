var karmaConfig = require('./config').karma;

module.exports = function(config) {
    'use strict';

    config.set( {
        basePath : '',
        frameworks: ['jasmine'],

        plugins: [
            'karma-*'
        ],

        files : [
          'bower_components/lodash/lodash.js',
          'bower_components/underscore.string/dist/underscore.string.js',
          'bower_components/angular/angular.js',
          'bower_components/angular-mocks/angular-mocks.js',
          'source/*.js',
          'test/spec/*.js'
        ],

        exclude : [],

        preprocessors : {
            'source/**/*.js': 'coverage'
        },

        reporters : karmaConfig.reporters,

        coverageReporter : {
            reporters:[
                {type: 'html', dir: 'temp/coverage/'},
                {type: 'json', dir: 'temp/coverage/'},
                {type: 'lcov', dir: 'temp/coverage/'},
                {type: 'text-summary', dir: 'temp/coverage/'}
            ]
        },

        port : karmaConfig.port,

        colors : true,

        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel : config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch : false,

        browsers : karmaConfig.browsers,

        captureTimeout : karmaConfig.captureTimeout
    });
};
