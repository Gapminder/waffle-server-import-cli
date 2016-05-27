'use strict';

const stepBase = require('./../../model/base-step');
const util = require('util');
const cliProgress = require('./../../service/ui-progress');
const inquirer = require('inquirer');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

// Question Definition

let question = {
  'name': 'flow-import-dataset-path',
  'type': 'input',
  'default': './../ddf--gapminder_world/output/ddf-full-stub/',
  'message': 'Filesystem asks for "Full path" to folder with DDF'
};

// Own Process Implementation

var fs = require('fs');
var path = require('path');
var importDdfService = require('./../../service/import-ddf');

step.prototype.process = function (inputValue) {
  var done = this.async();

  fs.readdir(inputValue, function(error, files){

    if (error) {
      return done(null, error.message);
    }

    // clear folders
    var filesOnly = files.filter(function (file) {
      var fileLocation = path.join(inputValue, file);
      return path.extname(file) == '.csv' && fs.statSync(fileLocation).isFile();
    });

    if(filesOnly.length < 1) {
      return done(null, 'Empty folder or No CSV files found');
    }

    importDdfService.process(inputValue, filesOnly, function(error, result){

      if(error) {
        return done(null, "Something went wrong");
      }

      //console.log("Import status::",result);
      return done(null, true);
    })

  });
};

// Export Module

module.exports = new step(question);
