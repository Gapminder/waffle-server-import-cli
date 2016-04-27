'use strict';

var stepBase = require('./../model/base-step');
var util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

var inquirer = require('inquirer');

var question = {
  'name': 'choose-flow',
  'type': 'list',
  'message': 'Choose Flow',
  'choices': [
    'Import Translations',
    'Import DataSet',
    'Publish DataSet',
    new inquirer.Separator(),
    'Exit'
  ]
};

/**************************************************************************************************************/

var holder = require('./../model/value-holder');
var request = require('request-defaults');

step.prototype.process = function (inputValue) {
  var done = this.async();

  if(inputValue == 'Publish DataSet') {

    request.api.post(
      'http://localhost:3010/get-data-set-non-published',
      //{form: data},
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          if(body && body.length) {
            var datasetsRaw = JSON.parse(body);
            var datasetsReady = datasetsRaw.map(function(value) {
              return value.dsId;
            });

            holder.setResult('publish-dataset-non-published', datasetsReady);
            done(null, true);
          } else {
            done(null, 'Non-published Data Sets were not found.');
          }
        } else {
          done(null, 'Server Error. Please try again later.');
        }
      }
    );

  } else {
    done(null, true);
  }
};

/**************************************************************************************************************/

module.exports = new step(question);
