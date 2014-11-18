/* global assert, suite, test */

suite('Global Tests', function () {
    'use strict';
    test('page has a valid title', function () {
        assert(document.title &&
               document.title.match(/\S/) &&
               document.title.toUpperCase() !== 'TODO');
    });
});
