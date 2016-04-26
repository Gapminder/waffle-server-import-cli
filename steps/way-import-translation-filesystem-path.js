'use strict';

var stepBase = require('./../model/base-step');
var util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

var question = {
  'name': 'way-import-translation-filesystem-path',
  'type': 'input',
  'default': '/home/v/projects/vizabi_fork/.data/translation/',
  'message': 'Filesystem asks for "Full path" to folder with translations'
};

/**************************************************************************************************************/

var fs = require('fs');
var holder = require('./../model/value-holder');
var path = require('path');

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

/**************************************************************************************************************/

module.exports = new step(question);
