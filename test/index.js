'use strict';

var fs = require('fs'),

    Lab = require('lab'),
    lab = Lab.script();

exports.lab = lab;

lab.experiment('glob', function () {
    lab.test('find-main', function (done) {
        var bowerComponents = require('../lib')({
            cwd: 'vendor/bower',
            minified: false
        });
        fs.open(bowerComponents("moment"),'r',done);
    });
    lab.test('find-plugin', function (done) {
        var bowerComponents = require('../lib')({
            cwd: 'vendor/bower',
            minified: false
        });
        fs.open(bowerComponents("greensock","EasePack"),'r',done);
    });
    lab.test('find-main-minified', function (done) {
        var bowerComponents = require('../lib')({
            cwd: 'vendor/bower',
            minified: true
        });
        fs.open(bowerComponents("moment"),'r',done);
    });
    lab.test('find-plugin-minified', function (done) {
        var bowerComponents = require('../lib')({
            cwd: 'vendor/bower',
            minified: true
        });
        fs.open(bowerComponents("greensock","EasePack"),'r',done);
    });
});