describe('AiServerLogger', function() {
    'use strict';

    var log;
    var mockBackend;
    var timeOutFunction;
    var mockSetTimeout = function(f) {
        timeOutFunction = f;
        return 5;
    };
    var headers = {
        'X-Authentication-Token': 'foobar1234'
    };

    var mockLog = {
        error: function(){},
        warn: function(){},
        info: function(){},
        debug: function(){},
        trace: function(){}
    };

    beforeEach(module(function($provide) {
        $provide.value('$log', mockLog);
    }));

    describe('with typical configuration', function() {
        beforeEach(module('ai.public.serverLogger', function(AiServerLoggerProvider) {
            AiServerLoggerProvider.setServerPostEndPoint('http://localhost:3000/logs');
            AiServerLoggerProvider.setQueueSize(3);
            AiServerLoggerProvider.setHeaders(headers);
            AiServerLoggerProvider.setPostToServerDelay(1000);
        }));

        beforeEach(inject(function($log, $httpBackend) {
            log = $log;
            mockBackend = $httpBackend;
            spyOn(window, 'setTimeout').and.callFake(mockSetTimeout);
            spyOn(window, 'clearTimeout').and.callFake(function() {});
        }));

        afterEach(function() {
         mockBackend.verifyNoOutstandingExpectation();
         mockBackend.verifyNoOutstandingRequest();
       });

        it('should result in defined logger', function() {
            expect(log).toBeDefined();
        });

        it('should add message info to the queue and start a timeout to send info to the server', function() {
            log.info('test');

            expect(window.setTimeout).toHaveBeenCalled();
        });

        it('should add serialized message info to the queue when $log is called with multiple arguments', function() {
            log.info('test', 'one', 2);

            expect(window.setTimeout).toHaveBeenCalled();
            timeOutFunction();

            mockBackend.expectPOST('http://localhost:3000/logs', [
                {'Message': JSON.stringify(['test', 'one', 2]), 'Level': 'Info'}
            ], function(headers) {
                return headers['X-Authentication-Token'] === 'foobar1234';
            }).respond(201, '');
            mockBackend.flush();
        });

        it('should serialize no parameters as empty array', function() {
            log.info();

            expect(window.setTimeout).toHaveBeenCalled();
            timeOutFunction();

            mockBackend.expectPOST('http://localhost:3000/logs', [
                {'Message': '[]', 'Level': 'Info'}
            ]).respond(201, '');
            mockBackend.flush();
        });

        _.each([
            {method: 'info', level: 'Info'},
            {method: 'debug', level: 'Debug'},
            {method: 'error', level: 'Error'},
            {method: 'warn', level: 'Warning'},
            {method: 'trace', level: 'Trace'},
        ], function(testData) {
            it('should send formatted message to the server after a timeout for ' + testData.method, function() {
                log[testData.method]('test');
                timeOutFunction();

                mockBackend.expectPOST('http://localhost:3000/logs', [
                    {'Message': 'test', 'Level': testData.level}
                ]).respond(201, '');
                mockBackend.flush();
            });
        });

        it('should cancel existing timout if queue size threshold is reached and post to the server 3 messages',
            function() {

            log.info('test 1');
            log.info('test 2');
            log.info('test 3');

            expect(window.clearTimeout).toHaveBeenCalledWith(5);
            mockBackend.expectPOST('http://localhost:3000/logs', [
                {'Message': 'test 1', 'Level': 'Info'},
                {'Message': 'test 2', 'Level': 'Info'},
                {'Message': 'test 3', 'Level': 'Info'}
            ]).respond(201, '');
            mockBackend.flush();
            expect(window.setTimeout).toHaveBeenCalled();
            timeOutFunction();
        });
    });

    describe('without server post end point', function() {
        var log;

        beforeEach(module('ai.public.serverLogger', function(AiServerLoggerProvider) {
            AiServerLoggerProvider.setQueueSize(3);
            AiServerLoggerProvider.setHeaders(headers);
            AiServerLoggerProvider.setPostToServerDelay(1000);
        }));

        beforeEach(inject(function($log, $httpBackend) {
            log = $log;
            mockBackend = $httpBackend;
            spyOn(window, 'setTimeout').and.callFake(mockSetTimeout);
        }));

        it('should not queue the message', function() {
            log.info('test');
            timeOutFunction();

            mockBackend.verifyNoOutstandingExpectation();
            mockBackend.verifyNoOutstandingRequest();
        });
    });

    describe('without custom parameter transformation', function() {
        var log;

        beforeEach(module('ai.public.serverLogger', function(AiServerLoggerProvider) {
            AiServerLoggerProvider.setServerPostEndPoint('http://localhost:3000/logs');
            AiServerLoggerProvider.setQueueSize(3);
            AiServerLoggerProvider.setHeaders(headers);
            AiServerLoggerProvider.setPostToServerDelay(1000);
            AiServerLoggerProvider.setTransformParameters(function() {return {foo: 'bar'};});
        }));

        beforeEach(inject(function($log, $httpBackend) {
            log = $log;
            mockBackend = $httpBackend;
            spyOn(window, 'setTimeout').and.callFake(mockSetTimeout);
        }));

        it('should post the message after appling custom transformation to log function arguments', function() {
            log.info('test');
            expect(window.setTimeout).toHaveBeenCalled();
            timeOutFunction();

            mockBackend.expectPOST('http://localhost:3000/logs', [{'foo': 'bar'}]).respond(201, '');
            mockBackend.flush();
        });
    });
});
