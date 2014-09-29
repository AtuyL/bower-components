'use strict';

var fs = require('fs'),
    chalk = require('chalk'),

    Lab = require('lab'),
    lab = Lab.script();

exports.lab = lab;

lab.experiment('glob', function () {
    var bower_components = require('../lib')({
        cwd: 'vendor/bower',
        minified: true
    });
    lab.test('no-options', function (done) {
        console.info([
            bower_components('async'),
            bower_components('greensock'),
            bower_components('greensock', 'TimelineMax'),
            bower_components('easeljs'),
            bower_components('easeljs', 'movieclip')
        ]);
        done();
    });
});
