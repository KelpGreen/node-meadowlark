/* global suite, test */

'use strict';

var loadtest = require('loadtest'),
    expect   = require('chai').expect;

suite('Stress tests', function () {

    test('Homepage should handle 100 requests in a second', function (done) {
        var options = {
            url:            'http://localhost:' + process.env.PORT,
            concurrency:    4,
            maxRequests:    100
        };

        loadtest.loadTest(options, function (err, result) {
            expect(err);
            expect(result.totalTimeSeconds < 1);
            done();
        });
    });

});