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
  'name': 'flow-import-dataset-choose',
  'type': 'list',
  'message': 'DataSet Action',
  'default': 'Update (version of existed DataSet)',
  'choices': [
    'Import (create new DataSet)',
    'Update (version of existed DataSet)',
    new inquirer.Separator(),
    'Back'
  ]
};

/**************************************************************************************************************/

var holder = require('./../model/value-holder');
var request = require('request-defaults');

step.prototype.process = function (inputValue) {

  var done = this.async();
    
  if(inputValue == 'Update (version of existed DataSet)') {

    request.api.post(
      'http://localhost:3010/get-data-set-for-update',
      //{form: data},
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          if(body) {
            holder.setResult('flow-import-dataset-choose', body.list);
            done(null, true);
          } else {
            done(null, 'No Data were found on Server Side.');
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
