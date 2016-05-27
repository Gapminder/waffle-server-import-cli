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

// Own Process Implementation

const holder = require('./../../model/value-holder');
const request = require('request-defaults');

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

// Export Module

module.exports = new step(question);
