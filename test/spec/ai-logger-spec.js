describe('LoggingService', function() {
    'use strict';
    var mockLog = {
        error: function(){},
        warn: function(){},
        info: function(){},
        debug: function(){},
        trace: function(){}
    };
    var testTimeStamp = '2015-01-01 11:00:00 (Unicorn Time)';
    var testMessageFormat = 'unicornFormat';
    var testApp = 'testApp';
    var mockTranslator = function(value) { return 't:' + value; };
    var mockFormatter = function() { return [].concat(_.map(arguments)).join(' '); };
    var mockTimeStampGenerator = function() { return testTimeStamp; };

    var constructExpectedString = function(logLevel, loggerName, message) {
        return window.s.sprintf(
            '%s %s %s %s t:%s', testMessageFormat, testTimeStamp, logLevel, loggerName, message);
    };

    describe('with full configuration', function() {
        var logger;

        beforeEach(module('ai.public.logger', function(aiLoggerProvider) {
            aiLoggerProvider.setAppName(testApp);
            aiLoggerProvider.setOutputWritter(mockLog);
            aiLoggerProvider.setTranslator(mockTranslator);
            aiLoggerProvider.setStringFormatter(mockFormatter);
            aiLoggerProvider.setLogLevel('trace');
            aiLoggerProvider.setTimeStampGenerator(mockTimeStampGenerator);
            aiLoggerProvider.setMessageFormat(testMessageFormat);
        }));

        beforeEach(inject(function(aiLogger) {
            logger = aiLogger;
        }));

        it('should result in defined logger', function() {
            expect(logger).toBeDefined();
        });

        [
            {functionName: 'error', level:'ERROR', logFunction: 'error'},
            {functionName: 'warn', level: 'WARNING', logFunction: 'warn'},
            {functionName: 'info', level: 'INFO', logFunction: 'info'},
            {functionName: 'debug', level: 'DEBUG', logFunction: 'debug'},
            {functionName: 'trace', level: 'TRACE', logFunction: 'debug'}
        ].forEach(function(testData) {
            describe(testData.functionName, function() {
                it('should output formatted string', function() {
                    spyOn(mockLog, testData.logFunction);
                    logger[testData.functionName]('foo');
                    var expectedString = constructExpectedString(testData.level, testApp, 'foo');

                    expect(mockLog[testData.logFunction]).toHaveBeenCalledWith(expectedString);
                });

                it('should output formatted string with multiple parameters', function() {
                    spyOn(mockLog, testData.logFunction);
                    logger[testData.functionName]('foo', 'bar', 3);
                    var expectedString = constructExpectedString(testData.level, testApp, 'foo t:bar t:3');

                    expect(mockLog[testData.logFunction]).toHaveBeenCalledWith(expectedString);
                });

                it('should do nothing if logger logLevel is less then that of the log function', function() {
                    if(testData.functionName !== 'error') {
                        spyOn(mockLog, testData.logFunction);
                        logger.setLogLevel(0);

                        logger[testData.functionName]('foo');

                        expect(mockLog[testData.logFunction]).not.toHaveBeenCalled();
                    }
                });
            });
        });

        describe('setLogLevel', function() {
            it('should throw if given invalid numer', function() {
                var expectedError = new Error('Cannot set log level: log level must be >= 0 and <= 4');

                expect(function() { logger.setLogLevel(-1); }).toThrow(expectedError);
                expect(function() { logger.setLogLevel(5); }).toThrow(expectedError);
            });

            it('should throw if given invalid string', function() {
                var expectedError = new Error('Log level FOOBAR is unknown');

                expect(function() { logger.setLogLevel('FOOBAR'); }).toThrow(expectedError);
            });

            it('should throw if given invalid type', function() {
                var expectedError = new Error('Cannot set log level: unknown log level type');

                expect(function() { logger.setLogLevel(); }).toThrow(expectedError);
            });
        });

        describe('getLogger', function() {
            it('should return a logger object that has different name', function() {
                var newLogger = logger.getLogger('otherLogger');
                spyOn(mockLog, 'info');
                newLogger.info('baz');

                var expectedString = constructExpectedString('INFO', testApp + '.otherLogger', 'baz');

                expect(mockLog.info).toHaveBeenCalledWith(expectedString);
            });
        });
    });

    describe('with partial configuration', function() {
        var logger;

        beforeEach(module('ai.public.logger', function(aiLoggerProvider) {
            aiLoggerProvider.setOutputWritter(mockLog);
            aiLoggerProvider.setStringFormatter(mockFormatter);
            aiLoggerProvider.setMessageFormat(testMessageFormat);
            aiLoggerProvider.setLogLevel('trace');
        }));

        beforeEach(inject(function(aiLogger) {
            logger = aiLogger;
            spyOn(mockLog, 'info');
        }));

        it('should use default unknownApp name', function(){
            logger.info('bam');

            var loggedMessage = mockLog.info.calls.mostRecent().args[0];

            expect(_.includes(loggedMessage, 'unknownApp')).toBe(true);
        });

        it('should use default noop translator', function(){
            logger.info('bim');

            var loggedMessage = mockLog.info.calls.mostRecent().args[0];

            expect(_.includes(loggedMessage, 'unknownApp bim')).toBe(true);
        });

        it('should use default timeStampGenerator', function(){
            logger.info('baz');

            var loggedMessage = mockLog.info.calls.mostRecent().args[0];

            expect(_.includes(loggedMessage, '(UTC)')).toBe(true);
        });
    });
});
