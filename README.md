# AI Angular logger

Angular $log service is very basic and we needed something a bit more configurable that can be used by many applications.  It provides a time stamp, visually aligns messages, has convenient logger name differentiation and provides support for localizing messages.

## Dependencies
This module uses lodash [Lo-Dash](https://github.com/lodash/lodash) and that is the only required dependency.  The module also uses [underscore.string](https://github.com/epeli/underscore.string) but, you can provide your own string formatting function and not even load this one.

## Usage

### Install from brower
    bower install ai-logger

### Building from sour code
    git clone https://github.com/AquaticInformatics/angular-logger.git
    npm install
    gulp build


### Example
```javascript
angular.module('someModule', [])
  .controller(function($scope, aiLogger) {
     var logger = aiLogger.getLogger('someModule');

     logger.info('This is an %s message', 'info');
     logger.debug('This one is %s message %d', 'debug', 2);
  });
```

## configuration

Since this is a provider you can configure it once for the whole application:

```javascript
angular.module('someModule', [])
    .config(function(aiLoggerProvider) {
        aiLoggerProvider.setAppName('aiLoggerDemoApp');
        aiLoggerProvider.setLogLevel('trace');
    })
    .controller(function($scope, aiLogger) {
       var logger = aiLogger.getLogger('someModule');

       logger.info('This is an %s message', 'info');
       logger.debug('This one is %s message %d', 'debug', 2);
    });
```


### Supported Configuration Functions

#### setAppName
Configures the top level logger name.  If you don't provide one 'unknownApp' will be used.

#### setOutputWritter
Lets you configure whether the logger will log using $log or some other logger (like window.console).  
Any custom logger object has to have these function: error, warn, info, debug and trace.

#### setTranslator
The built-in translator just returns the given value, if you want translations you have to specify a function that will do that.  The built-in translator is applied to every parameter passed to logging functions.

#### setStringFormatter
aiLogger uses underscore.string.sprintf to compose the logged message as well as to substitute any place holders in messages when there are many parameters.

```javascript
    aiLogger.info('this is a %s with a %d parameters', 'test', 3);
```
If you don't want to have underscore.string dependency or want to use an existing string formatter you can change it.

#### setLogLevel
Sets the minimum log level that will be logged, the rest will be ignored.  Error has log level 0, warning 1, info 2, debug 3 and trace 4.  It is handy to set this level to value from a cookie or a url parameter.

#### setTimeStampGenerator
The default time stamp format is yyyy-mm-dd HH:MM:ss.SSS (UTC).  You can provide your own function that generates the format you like.

#### setMessageFormat
This pattern determines how the entire message is composed.  The default pattern is: '%1$s  %2$-7s  %3$s - %4$s'.
The first parameter is a time stamp, the second is log level (aligned within 7 spaces), third is logger name and 4th is composed message.  If you want to switch them around you can change the %X value or you can exclude some information.  For example, '%4s' will only log composed message.  For more information on sprintf checkout
[javascript-sprintf](http://www.diveintojavascript.com/projects/javascript-sprintf)

## Logger Functions

#### getLogger
Returns another instance of a logger with a new name (new name is formed by appending given name to existing name).  

#### setLogLevel
Each instance of a logger can be configured independently at which minimum level the messages will be logged.

#### error
Logs the formatted message to output writer

#### warn
Logs the formatted message to output writer if log level is warn or greater

#### info
Logs the formatted message to output writer if log level is info or greater

#### debug
Logs the formatted message to output writer if log level is debug or greater

#### trace
Logs the formatted message to output writer if log level is trace
