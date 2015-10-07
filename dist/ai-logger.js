// Copyright 2015 Aquatic Informatics Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
(function() {
    'use strict';

    var loggerLogLevels = {
        error: 0,
        warning: 1,
        info: 2,
        debug: 3,
        trace: 4
    };

    angular.module('ai.public.logger', ['ng'])
        .constant('AiLoggerLogLevels', loggerLogLevels)
        .provider('AiLogger', function() {
            var logLevelNames = ['ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'];
            var logFunctionNames = ['error', 'warn', 'info', 'debug', 'trace'];
            var logLevel = loggerLogLevels.info;
            var translator = function(value) { return value; };
            var stringFormatter;
            var messageFormat = '%1$s  %2$-7s  %3$s - %4$s';
            var appName = 'unknownApp';

            var timeStampGenerator = function() {
                var now = new Date();
                var iso = now.toISOString().replace(/T/g, ' ');
                return iso.replace(/Z/g, ' (UTC)');
            };

            var toValidLogLevel = function(logLevel) {
                if(angular.isString(logLevel)) {
                    var matchedKey = _.find(logLevelNames, function(logLevelName) {
                        return logLevelName === logLevel.toUpperCase();
                    });
                    if(angular.isDefined(matchedKey)) {
                        return loggerLogLevels[matchedKey];
                    }
                    throw new Error('Log level ' + logLevel + ' is unknown');
                } else if(_.isFinite(logLevel)) {
                    if(logLevel < loggerLogLevels.error || logLevel > loggerLogLevels.trace) {
                        throw new Error('Cannot set log level: log level must be >= 0 and <= 4');
                    }
                    return logLevel;
                }
                throw new Error('Cannot set log level: unknown log level type');
            };

            var Logger = (function() {
                function Logger(loggerConfig) {
                    var self = this;
                    var config = loggerConfig;

                    this.getLogger = function(loggerName) {
                        var newLoggerName = String(loggerName);
                        if(loggerConfig.loggerName.length > 0) {
                            newLoggerName = loggerConfig.loggerName + '.' + newLoggerName;
                        }
                        return new Logger(_.assign({}, loggerConfig, {loggerName: newLoggerName}));
                    };

                    this.setLogLevel = function(logLevel) {
                        config.logLevel = toValidLogLevel(logLevel);
                    };

                    var translateMessage = function(parameters) {
                        var withoutLogLevel = _.rest(parameters);
                        return config.stringFormatter.apply(null, _.map(withoutLogLevel, config.translator));
                    };

                    var logMessage = function(logLevel) {
                        if(config.logLevel < logLevel) { return; }

                        var fullMessage = config.stringFormatter(
                            config.messageFormat,
                            config.timeStampGenerator(),
                            logLevelNames[logLevel],
                            config.loggerName,
                            translateMessage(arguments)
                        );

                        var outputFunctionName = logFunctionNames[logLevel];
                        if(logLevel === loggerLogLevels.trace) {
                            outputFunctionName = _.isUndefined(config.outputWritter[outputFunctionName]) ?
                                logFunctionNames[loggerLogLevels.debug] :
                                logFunctionNames[logLevel];
                        }

                        config.outputWritter[outputFunctionName](fullMessage);
                    };

                    _.each(logFunctionNames, function(logFunctionName, indexMatchingLogLevel) {
                        self[logFunctionName] = _.bind(logMessage, self, indexMatchingLogLevel);
                    });
                }
                return Logger;
            }());

            return {
                setAppName: function(name) {
                    appName = String(name);
                },
                setTranslator: function(translatorFunction) {
                    translator = translatorFunction;
                },
                setStringFormatter: function(stringFormatterFunction) {
                    stringFormatter = stringFormatterFunction;
                },
                setLogLevel: function(level) {
                    logLevel = toValidLogLevel(level);
                },
                setTimeStampGenerator: function(timeStampGeneratorFunction) {
                    timeStampGenerator = timeStampGeneratorFunction;
                },
                setMessageFormat: function(formattingPattern) {
                    messageFormat = formattingPattern;
                },
                $get: function($log, $window) {
                    if(_.isUndefined(stringFormatter)) {
                        stringFormatter = $window.s.sprintf;
                    }
                    return new Logger({
                        loggerName: appName,
                        outputWritter: $log,
                        translator: translator,
                        stringFormatter: stringFormatter,
                        logLevel: logLevel,
                        timeStampGenerator: timeStampGenerator,
                        messageFormat: messageFormat
                    });
                }
            };
        });
})();

(function() {
    'use strict';

    angular.module('ai.public.serverLogger', ['ng'])
        .config(function($provide) {
            $provide.decorator('$log', function($delegate, $injector) {
                var logger = $injector.get('AiServerLogger');
                var delegateError = $delegate.error;
                var delegateWarn = $delegate.warn;
                var delegateInfo = $delegate.info;
                var delegateDebug = $delegate.debug;

                var enhanceLoggingFunction = function(loggingFunction, severity) {
                    return function() {
                        var callArguments = _.toArray(arguments);
                        loggingFunction.apply(null, callArguments);

                        var message = callArguments.length === 1 ?
                            _.first(callArguments) :
                            JSON.stringify(callArguments);

                        logger.send(message, severity);
                    };
                };

                $delegate.error = enhanceLoggingFunction(delegateError, 'Error');
                $delegate.warn = enhanceLoggingFunction(delegateWarn, 'Warning');
                $delegate.info = enhanceLoggingFunction(delegateInfo, 'Info');
                $delegate.debug = enhanceLoggingFunction(delegateDebug, 'Debug');
                $delegate.trace = enhanceLoggingFunction(delegateDebug, 'Trace');

                return $delegate;
            });
        })
        .provider('AiServerLogger', function() {
            var headers = {};
            var serverPostEndPoint;
            var queueSize = 100;
            var postToServerDelay = 1000 * 60 * 10;  //10 minutes

            var transformParameters = function() {
                return {
                    Message: arguments[0],
                    Level: arguments[1]
                };
            };

            var ServerLogger = (function() {
                function ServerLogger(loggerConfig) {
                    var config = loggerConfig;
                    var queue = [];
                    var timeoutId;
                    var $http;

                    this.send = function() {
                        if(_.isUndefined(config.serverPostEndPoint)) {
                            console.log('Cannot send log messages to unknown server end point.  ' +
                                'Check AiServerLoggerProvider configuration.');
                            return;
                        }
                        var dto = transformParameters.apply(null, arguments);
                        queue.push(dto);
                        processQueue();
                    };

                    var processQueue = function() {
                        if(angular.isDefined(timeoutId)) {
                            if(queue.length >= config.queueSize) {
                                clearTimeout(timeoutId);
                                postToServer();
                            }
                        }

                        timeoutId = setTimeout(function() {
                            timeoutId = undefined;
                            if(queue.length === 0) { return ; }

                            postToServer();
                        }, config.postToServerDelay);
                    };

                    var postToServer = function() {
                        var payload = _.take(queue, config.queueSize);
                        queue = _.slice(queue, config.queueSize);

                        if(_.isUndefined($http)) {
                            $http = config.injector.get('$http');
                        }
                        $http({
                            method: 'POST',
                            url: config.serverPostEndPoint,
                            headers: config.headers,
                            data: payload
                        });
                    };
                }

                return ServerLogger;
            }());

            return {
                setServerPostEndPoint: function(endpoint) {
                    serverPostEndPoint = endpoint;
                },
                setQueueSize: function(size) {
                    queueSize = size;
                },
                setHeaders: function(headerInfo) {
                    _.assign(headers, headerInfo);
                },
                setPostToServerDelay: function(delay) {
                    postToServerDelay = delay;
                },
                setTransformParameters: function(transformParametersFunction) {
                    transformParameters = transformParametersFunction;
                },
                $get: function($injector) {
                    return new ServerLogger({
                        injector: $injector,
                        headers: headers,
                        queueSize: queueSize,
                        postToServerDelay: postToServerDelay,
                        serverPostEndPoint: serverPostEndPoint
                    });
                }
            };
        });
}());
