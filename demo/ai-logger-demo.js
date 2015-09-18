(function() {
    'use strict';

    angular.module('ai.public.logger.demo', ['ng', 'ai.public.logger']);

    var demoApp = angular.module('ai.public.logger.demo');

    demoApp.config(function(aiLoggerProvider) {
        aiLoggerProvider.setAppName('aiLoggerDemoApp');
        aiLoggerProvider.setLogLevel('trace');
        aiLoggerProvider.setMessageFormat('%1$s  %2$-7s  %3$s - %4$s');
    });

    demoApp.controller('aiLoggerDemoController', function($scope, aiLogger) {
        aiLogger.error('Error sent to application logger');
        aiLogger.warn('Warning sent to application logger');
        aiLogger.info('Info sent to application logger');
        aiLogger.debug('Debug sent to application logger');
        aiLogger.trace('Trace sent to application logger');

        var controllerLogger = aiLogger.getLogger('demoController');
        controllerLogger.info('Hi from controllerLogger');

        var uberFunction = function() {
            var functionLogger = controllerLogger.getLogger('uberFunction');
            functionLogger.info('Hi from %s which was called with %d parameters.', 'uberFunction', 2);
        };

        uberFunction();
    });
}());
