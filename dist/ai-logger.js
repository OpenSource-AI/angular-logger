(function() {
    'use strict';

    var theModule = angular.module('ai.public.logger', ['ng']);

    var loggerLogLevels = {
        error: 0,
        warning: 1,
        info: 2,
        debug: 3,
        trace: 4
    };

    theModule.constant('aiLoggerLogLevels', loggerLogLevels);

    theModule.provider('aiLogger', function() {
        var logLevelNames = ['ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'];
        var logFunctionNames = ['error', 'warn', 'info', 'debug', 'trace'];
        var logLevel = loggerLogLevels.info;
        var outputWritter;
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

                    var outputFunctionName = (logLevel === loggerLogLevels.trace) ?
                        logFunctionNames[loggerLogLevels.debug] :
                        logFunctionNames[logLevel];

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
            setOutputWritter: function(writter) {
                outputWritter = writter;
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
                if(_.isUndefined(outputWritter)) {
                    outputWritter = $log;
                }
                if(_.isUndefined(stringFormatter)) {
                    stringFormatter = $window.s.sprintf;
                }
                return new Logger({
                    loggerName: appName,
                    outputWritter: outputWritter,
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
