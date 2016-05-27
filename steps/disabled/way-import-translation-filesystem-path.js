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
  'name': 'way-import-translation-filesystem-path',
  'type': 'input',
  'default': './../vizabi/.data/translation/',
  'message': 'Filesystem asks for "Full path" to folder with translations'
};

// Own Process Implementation

const fs = require('fs');
const path = require('path');
const holder = require('./../../model/value-holder');

step.prototype.process = function (inputValue) {

  var done = this.async();

  fs.readdir(inputValue, function(error, files){

    if (error) {
      return done(null, error.message);
    }

    // clear folders
    var filesOnly = files.filter(function (file) {
      var fileLocation = path.join(inputValue, file);
      return path.extname(file) == '.json' && fs.statSync(fileLocation).isFile();
    });

    if(filesOnly.length < 1) {
      return done(null, 'Empty folder or No JSON files found');
    }

    holder.setResult('translation-filesystem-files', {
      'path': inputValue,
      'list': filesOnly
    });

    done(null, true);
  });
};

// Export Module

module.exports = new step(question);
