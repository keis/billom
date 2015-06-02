'use strict'

var dependencyDetails = require('npm-dependency-details')
  , parallel = require('run-parallel')
  , npmconf = require('npmconf')
  , hogan = require('hogan.js')
  , path = require('path')
  , fs = require('fs')
  , npmLogger = require('./npm-logger')

module.exports =
  { configure: configure
  , generate: generate
  }

// Load a mustache template
function loadTemplate(filename, callback) {
  fs.readFile(filename, 'utf-8', function (err, data) {
    var template

    if (err) {
      return callback(err)
    }

    try {
      template = hogan.compile(data)
    } catch (err) {
      return callback(err)
    }

    callback(null, template)
  })

  return function (fun) {
    callback = fun
  }
}

// Configure npm
function configure(callback) {
  npmconf.load({log: npmLogger}, callback)
}

// Generate report on used packages
function generate(config, dir, title, callback) {
  parallel([ loadTemplate(path.join(__dirname, '../template.tmpl'))
           , dependencyDetails({config: config, depth: 0}, dir)
           ]
           , function (err, results) {
    var packages
      , details
      , template
      , result

    if (err) {
      callback(err)
    }

    template = results[0]
    details = results[1]
    packages = Object.keys(details)

    result = packages.map(function (key) {
      var detail = details[key]

      return { package: key
             , current: detail.current
             , installed: detail.installed
             , latest: detail.latest
             , outdated: detail.installed !== detail.latest }
    })

    callback(null, template.render({ title: title
                                   , packages: result
                                   }))
  })
}
