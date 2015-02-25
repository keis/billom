#!/usr/bin/env node
'use strict';

var dependencyDetails = require('npm-dependency-details'),
    async = require('async'),
    npmconf = require('npmconf'),
    hogan = require('hogan.js'),
    path = require('path'),
    fs = require('fs'),
    rapidus = require('rapidus'),
    createFormatter = require('rapidus-sparkle').createFormatter,
    npmLogger = require('./npm-logger');

// Load a mustache template
function loadTemplate(filename, callback) {
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

    return function (fun) {
        callback = fun;
    }
}

// Configure npm
function configure(callback) {
    npmconf.load({log: npmLogger}, callback);
}

// Generate report on used packages
function generate(config, dir, title, callback) {
    async.parallel([
        loadTemplate(path.join(__dirname, 'template.tmpl')),
        dependencyDetails({config: config, depth: 0}, dir)
    ], function (err, results) {
        var packages,
            details,
            template,
            result;

        if (err) {
            callback(err);
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

        callback(null, template.render({
            title: title,
            packages: result
        }));
    });
}

function main() {
    var yargs = require('yargs'),
        argv,
        packageFile,
        title,
        dir;

    argv = yargs
        .usage('Usage: $0 [package.json] [title]')
        .argv

    if (argv.help) {
        return console.log(yargs.help());
    }

    packageFile = argv._[0] || 'package.json';
    title = argv._[1] || false;
    dir = path.dirname(packageFile);

    rapidus.getLogger('attempt').setLevel('ERROR');
    rapidus.getLogger().addSink(rapidus.sinks.console({
        format: createFormatter('%{green [:date :time]} :name [:levelName] - :message')
    }));

    configure(function (err, config) {
        generate(config, dir, title, function (err, result) {
            if (err) {
                return console.error('An error occured: ' + err);
            }

            process.stdout.write(result);
        });
    });
}

// Do stuff if this is the main module.
if (require.main === module) {
    main();
}
