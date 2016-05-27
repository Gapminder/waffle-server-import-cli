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
  'name': 'flow-publish-dataset-non-published',
  'type': 'list',
  'message': 'Choose Non-Published DataSet',
  'choices': []
};

// Own Process Implementation

const holder = require('./../../model/value-holder');
const request = require('request-defaults');

step.prototype.process = function (inputValue) {
  var done = this.async();

  request.api.post(
    'http://localhost:3010/get-data-set-non-published-version',
    {
      body: {
        'dataset_id': inputValue
      }
    },
    function (error, response, body) {

      if (!error && response.statusCode == 200) {
        if(body) {
          holder.setResult('flow-publish-dataset-version', body.list);
          done(null, true);
         } else {
          done(null, 'Server Error. Please try again later.');
         }
      } else {
        done(null, 'Server Error. Please try again later.');
      }
    }
  );

};

// Define Hook

step.prototype.prepare = function () {
  this.step.choices = holder.getResult('publish-dataset-non-published', []);
};

// Export Module

module.exports = new step(question);
