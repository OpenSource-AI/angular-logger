# AI Angular Server Logger

This library comes with a customizable batch posting service. It is built on top of $log meaning that if configured then any call to $log logging functions will be queued up to be sent to the server.

Note: This service also adds trace method to the $log service.

## Usage

### Include it in application dependencies
For the service to work you need to configure server post end point.  By default the server will queue up to 100 messages before posting them as an array.  If less then 100 message are queued up, after 10 minutes they will be posted to the server.

```javascript
angular.module('someModule', ['ai.public.serverLogger'])
    .config(function(AiServerLoggerProvider) {
        AiServerLoggerProvider.setServerPostEndPoint('http://localhost:3000/logs');
    })
    .controller(function($scope, $log) {
       $log.info('This is a test message');
    });
```

### Configuration with AiLogger
Since AiLogger uses $log, if you configure support for logging to server all messages that are of higher or equal log level of AiLogger will be sent to the server.

```javascript
    angular.module('ai.public.logger.demo', ['ng', 'ai.public.logger', 'ai.public.serverLogger']);

    angular.module('ai.public.logger.demo')
        .config(function(AiLoggerProvider, AiServerLoggerProvider) {
            AiServerLoggerProvider.setServerPostEndPoint('http://localhost:3000/logs');
            AiServerLoggerProvider.setHeaders({
                'X-Authentication-Token': 'someSuperSecretToken'
            });

            AiLoggerProvider.setAppName('aiLoggerDemoApp');
            AiLoggerProvider.setLogLevel('trace');
        });

        angular.module('ai.public.logger.demo')
            .controller('aiLoggerDemoController', function($scope, AiLogger) {
                AiLogger.error('Error sent to application logger');
                AiLogger.warn('Warning sent to application logger');
                AiLogger.info('Info sent to application logger');
                AiLogger.debug('Debug sent to application logger');
                AiLogger.trace('Trace sent to application logger');

                var controllerLogger = AiLogger.getLogger('demoController');
                controllerLogger.info('Hi from controllerLogger');
            });
```

### Supported Configuration Functions

#### setServerPostEndPoint
Sets the URL end point for posting messages.

#### setHeaders
This service uses $http for posting messages, you can provide custom headers object to be sent (for example you can set authentication token).

#### setQueueSize
Sets how many messages will be queues before being sent to the server.

#### setPostToServerDelay
Sets the delay in milliseconds before queued message will be sent to the server (even if queue is not full).

#### setTransformParameters
Sets a function that can transform all arguments passed to logging function to objects that will be sent to the server.
This way you can adapt the results to other logging services.
