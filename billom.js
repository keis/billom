#!/usr/bin/env node
'use strict';

var vm = require('npm-check-updates/lib/versionmanager'),
    async = require('async'),
    hogan = require('hogan.js'),
    path = require('path'),
    template,
    packageFile;

template = hogan.compile("<!doctype html><html><head>" +
    "<style>body {font-size: 16px;} tr.outdated {background: red}</style>" +
    "</head><body><table>" +
    "<tr><td>package</td><td>current</td><td>installed</td><td>latest</td></tr>" +
    "{{#packages}}<tr class=\"package{{#outdated}} outdated{{/outdated}}\">" +
    "<td>{{package}}</td><td>{{current}}</td><td>{{installed}}</td><td>{{latest}}</td></tr>{{/packages}}" +
    "</table></body></html>");

packageFile = process.argv[2] || 'package.json';

process.chdir(path.dirname(packageFile));
vm.initialize(false, function () {
    console.log(process.cwd());

    async.series({
        current: function (callback) {
            vm.getCurrentDependencies(packageFile, callback);
        },
        installed: function (callback) {
            vm.getInstalledPackages(callback);
        }
    }, function (err, results) {
        var packages;

        if (err) {
            return console.error('An error occured: ' + err);
        }

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
