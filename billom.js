#!/usr/bin/env node
'use strict';

var dependencyDetails = require('npm-dependency-details'),
    async = require('async'),
    npmconf = require('npmconf'),
    hogan = require('hogan.js'),
    path = require('path'),
    fs = require('fs'),
    rapidus = require('rapidus'),
    npmLogger = require('./npm-logger'),
    packageFile,
    title,
    dir;

function loadTemplate(callback) {
    var filename = path.join(__dirname, 'template.tmpl');
    fs.readFile(filename, 'utf-8', function (err, data) {
        var template;

        if (err) {
            return callback(err);
        }

        try {
            template = hogan.compile(data);
        } catch (err) {
            return callback(err);
        }

        callback(null, template);
    });
}

packageFile = process.argv[2] || 'package.json';
title = process.argv[3] || false;
dir = path.dirname(packageFile);

rapidus.getLogger().addSink(rapidus.sinks.console());

npmconf.load({log: npmLogger}, function (err, config) {
    async.parallel([
        loadTemplate,
        dependencyDetails(config, dir)
    ], function (err, results) {
        var packages,
            details,
            template,
            result;

        if (err) {
            return console.error('An error occured: ' + err);
        }

        template = results[0];
        details = results[1];
        packages = Object.keys(details);

        result = packages.map(function (key) {
            var detail = details[key];

            return {
                package: key,
                current: detail.current,
                installed: detail.installed,
                latest: detail.latest,
                outdated: detail.installed !== detail.latest
            };
        });

        process.stdout.write(template.render({
            title: title,
            packages: result
        }));
    });
});
