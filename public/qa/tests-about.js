suite('"About" Page Tests', function () {
    'use strict';
    test('page should contain link to contact page', function () {
        assert($('a[href="/contact"]').length);
    });
});
