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

step.prototype.process = function (inputValue) {

  var done = this.async();

  fs.readdir(inputValue, function(error, files){

    if (error) {
      done(null, error.message);
    }
    if(files.length < 1) {
      done(null, 'Empty folder');
    }

    holder.setResult('translation-filesystem-files', {
      'path': inputValue,
      'list': files
    });

    done(null, true);
  });
};

/**************************************************************************************************************/

module.exports = new step(question);
