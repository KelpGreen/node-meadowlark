/* jshint node: true */
/* global setup, suite, test */

'use strict';

var Browser = require('zombie'),
    /*jshint -W079 */
    assert  = require('chai').assert,
    /*jshint +W079 */

    browser;

// Doing this allows us to ignore the port in our test URLs.
Browser.localhost('localhost', process.env.PORT || 3000);

suite('Cross-Page Tests', function () {

    setup(function () {
        browser = Browser.create(); // new Browser();
    });

    test('requesting a group rate quote from the hood river tour page should ' +
            'populate the hidden referrer field correctly', function(done) {

        var referrer = 'http://localhost/tours/hood-river'; 
        browser.visit(referrer, function (err) {
            assert.ifError(err);

            browser.assert.success();

            browser.assert.element('.requestGroupRate');
            //browser.assert.link('.requestGroupRate', 'Request Group Rate', '/tours/request-group-rate');
            browser.clickLink('.requestGroupRate', function(err) {
                assert.ifError(err);
                //console.info('referrer = %s', browser.field('referrer').value)

                browser.assert.element('form input[name=referrer]');
                browser.assert.input('form input[name=referrer]', referrer,
                                     'Wrong referrer value: ' + referrer);
                assert(browser.field('referrer').value === referrer);

                done();
            });
        });
    });

    // This test is designed to fail, in order to demonstrate a test failure.
    /* Don't want failure anymore.
    test('requesting a group rate from the Oregon Coast tour page should ' +
         'populate the referrer field', function (done) {
        var referrer = 'http://localhost/tours/oregon-coast';
        browser.visit(referrer, function (err) {
            assert.ifError(err);

            browser.assert.success();

            browser.assert.element('.requestGroupRate');
            browser.clickLink('.requestGroupRate', function () {
                assert(browser.field('referrer').value === referrer);
                done();
            });
        });
    });
    */

    test('visiting the "request group rate" page directly should result in an ' +
         'empty referrer field', function (done) {
        var referrer = 'http://localhost/tours/request-group-rate';
        browser.visit(referrer, function () {
            assert(browser.field('referrer').value === '');
            done();
        });
    });
});

