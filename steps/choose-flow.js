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
  'default': 0,
  'choices': [
    {
      name: 'Import DataSet',
      value: 1
    },
    {
      name: 'Update DataSet',
      value: 2
    },
    {
      name: 'Import Translations',
      value: 3,
      disabled: 'disabled'
    },
    {
      name: 'Publish DataSet',
      value: 4,
      disabled: 'disabled'
    },
    new inquirer.Separator(),
    'Exit'
  ]
};

/**************************************************************************************************************/

var holder = require('./../model/value-holder');
var request = require('request-defaults');

step.prototype.process = function (inputValue) {
  var done = this.async();

  if(inputValue == 4) {

    request.api.post(
      'http://localhost:3010/get-data-set-non-published',
      //{form: data},
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          if(body) {
            var datasetsReady = body.map(function(value) {
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
    // setTimeout(function(){ done(null, true); }, 2000);
    done(null, true);
  }
};

/**************************************************************************************************************/

module.exports = new step(question);
