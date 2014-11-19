/* jshint node: true */
'use strict';

var fortune = require('../../lib/fortune'),
    expect  = require('chai').expect;

suite('fortune cookie tests', function() {

    test('getFortune() should return a fortune', function () {
        expect(typeof fortune.getFortune() === 'string');
    });
});
