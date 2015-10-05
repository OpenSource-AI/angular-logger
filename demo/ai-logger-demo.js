(function() {
    'use strict';

    angular.module('ai.public.logger.demo', ['ng', 'ai.public.logger', 'ai.public.serverLogger']);

    angular.module('ai.public.logger.demo')
        .config(function(AiLoggerProvider, AiServerLoggerProvider) {
            AiServerLoggerProvider.setServerPostEndPoint('http://localhost:3000/logs');
            AiServerLoggerProvider.setQueueSize(10);

            AiLoggerProvider.setAppName('aiLoggerDemoApp');
            AiLoggerProvider.setLogLevel('trace');
            AiLoggerProvider.setMessageFormat('%1$s  %2$-7s  %3$s - %4$s');
        });

    angular.module('ai.public.logger.demo')
        .controller('aiLoggerDemoController', function($scope, $log, AiLogger) {
            AiLogger.error('Error sent to application logger');
            AiLogger.warn('Warning sent to application logger');
            AiLogger.info('Info sent to application logger');
            AiLogger.debug('Debug sent to application logger');
            AiLogger.trace('Trace sent to application logger');

            var controllerLogger = AiLogger.getLogger('demoController');
            controllerLogger.info('Hi from controllerLogger');

            var uberFunction = function() {
                var functionLogger = controllerLogger.getLogger('uberFunction');
                functionLogger.info('Hi from %s which was called with %d parameters.', 'uberFunction', 2);
            };

            uberFunction();        
        });
}());
