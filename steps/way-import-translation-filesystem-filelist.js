'use strict';

var stepBase = require('./../model/base-step');
var util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

var question = {
  'name': 'way-import-translation-filesystem-filelist',
  'type': 'list',
  'message': 'Choose File',
  'choices': []
};

/**************************************************************************************************************/

var fs = require('fs');
var holder = require('./../model/value-holder');
var request = require('request-defaults');

step.prototype.process = function (inputValue) {
  var done = this.async();

  var selectedFile = inputValue;
  var filesystemInfo = holder.getResult('translation-filesystem-files');
  var readyFile = filesystemInfo.path + selectedFile;

  fs.readFile(readyFile, 'utf8', function(error, rawData){

    if (error) {
      done(null, error.message);
    }

    // save loaded data from file
    holder.setResult('translation-filesystem-data', rawData);

    request.api.post(
      'http://localhost:3010/get-data-set-published',
      {},
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          if(body) {
            var datasetsReady = body.map(function(value) {
              return value.dsId;
            });
            holder.setResult('translation-filesystem-datasets', datasetsReady);
            done(null, true);
          } else {
            done(null, 'Datasets were not found.');
          }
        } else {
          done(null, 'Server Error. Please try again later.');
        }
      }
    );

  });
};

// Define Hook

step.prototype.prepare = function () {
  var prevStepResult = holder.getResult('translation-filesystem-files', []);
  this.step.choices = prevStepResult.list;
};

/**************************************************************************************************************/

module.exports = new step(question);
