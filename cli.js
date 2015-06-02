#!/usr/bin/env node
'use strict'

var billom = require('./lib/billom')
  , rapidus = require('rapidus')
  , path = require('path')
  , createFormatter = require('rapidus-sparkle').createFormatter
  , configure = billom.configure
  , generate = billom.generate

function main() {
  var cli
    , packageFile
    , title
    , dir

  cli = require('meow')({
    help: 'Usage: billom [package.json] [title]'
  })

  packageFile = cli.input[0] || 'package.json'
  title = cli.input[1] || false
  dir = path.dirname(packageFile)

  rapidus.getLogger('attempt').setLevel('ERROR')
  rapidus.getLogger().addSink(rapidus.sinks.console({
      format: createFormatter('%{green [:date :time]} :name [:levelName] - :message')
  }))

  configure(function (err, config) {
    if (err) {
      return console.error('An error occured: ' + err)
    }

    generate(config, dir, title, function (err, result) {
      if (err) {
        return console.error('An error occured: ' + err)
      }

      process.stdout.write(result)
    })
  })
}

// Do stuff if this is the main module.
if (require.main === module) {
  main()
}
