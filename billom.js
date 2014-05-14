#!/usr/bin/env node
'use strict';

var vm = require('npm-check-updates/lib/versionmanager'),
    async = require('async'),
    hogan = require('hogan.js'),
    path = require('path'),
    fs = require('fs'),
    packageFile;

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

process.chdir(path.dirname(packageFile));
vm.initialize(false, function () {
    async.series({
        template: loadTemplate,
        current: function (callback) {
            vm.getCurrentDependencies(packageFile, callback);
        },
        installed: function (callback) {
            vm.getInstalledPackages(callback);
        }
    }, function (err, results) {
        var packages,
            template;

        if (err) {
            return console.error('An error occured: ' + err);
        }

        template = results.template;
        packages = Object.keys(results.installed);

        vm.getLatestVersions(packages, function (err, latest) {
            var result;

            result = packages.map(function (key) {
                var lv = latest[key],
                    iv = results.installed[key],
                    cv = results.current[key];

                return {
                    package: key,
                    current: cv,
                    installed: iv,
                    latest: lv,
                    outdated: iv !== lv
                };
            });

            console.log(template.render({packages: result}));
        });
    });
});
