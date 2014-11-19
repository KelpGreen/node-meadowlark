'use strict';

var port = process.env.PORT || 5000;

module.exports = function (grunt) {

    // Load plugins.
    [
        'grunt-cafe-mocha',
        'grunt-contrib-jshint',
        'grunt-exec'
    ].forEach(function (task) {
        grunt.loadNpmTasks(task);
    });

    // Configure plugins.
    grunt.initConfig({
        cafemocha: {
            all: { 
                src:        'qa/tests-*.js',
                options:    { ui: 'tdd' }
            }},
        jshint: {
            options: {
                jshintrc: true
            },
            //force:    true,
            app: [
                'meadowlark.js',
                'public/js/**/*.js',
                'lib/**/*.js'
            ],
            qa:  [
                'Gruntfile.js',
                'public/qa/**/*.js',
                'qa/**/*.js'
            ]
        },
        exec: {
            lintchecker: {
                cmd: 'linkchecker http://localhost:' + port
            }
        }
    });

    // Register tasks.
    grunt.registerTask('default', [
        'cafemocha',
        'jshint',
        'exec'
    ]);
};
