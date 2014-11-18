/* jshint node: true */
/* global setup */

'use strict';

var Browser = require('zombie'),
    assert  = require('chai').assert,
    port    = process.env.PORT || 3000,
    browser;

suite('Cross-Page Tests', function () {

    setup(function () {
        browser = new Browser();
    });

    test('requesting a group rate quote from the Hood River tour page ' +
         'should populate the referrer field', function (done) {
        var referrer = 'http://localhost:' + port + '/tours/hood-river';
        browser.visit(referrer, function () {
            browser.clickLink('.requestGroupRate', function () {
                assert(browser.field('referrer').value === referrer);
                done();
            });
        });
    });

    test('requesting a group rate from the Oregon Coast tour page should ' +
         'populate the referrer field', function (done) {
        var referrer = 'http://localhost:' + port + '/tours/oregon-coast';
        browser.visit(referrer, function () {
            browser.clickLink('.requestGroupRate', function () {
                assert(browser.field('referrer').value === referrer);
                done();
            });
        });
    });

    test('visiting the "request group rate" page directly should result in an ' +
         'empty referrer field', function (done) {
        var referrer = 'http://localhost:' + port + '/tours/request-group-rate';
        browser.visit(referrer, function () {
            assert(browser.field('referrer').value === '');
            done();
        });
    });
});

