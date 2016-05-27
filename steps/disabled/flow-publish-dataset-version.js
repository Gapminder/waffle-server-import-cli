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
  'name': 'flow-publish-dataset-version',
  'type': 'list',
  'message': 'Choose DataSet Version',
  'choices': []
};

// Own Process Implementation

const holder = require('./../../model/value-holder');
const request = require('request-defaults');

step.prototype.process = function (inputValue) {
  var done = this.async();

  request.api.post(
    'http://localhost:3010/publish-dataset',
    {
      body: {
        'dataset_id': holder.get('flow-publish-dataset-non-published', false),
        'version': inputValue
      }
    },
    function (error, response, body) {

      if (!error && response.statusCode == 200) {
        if(body) {
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
  this.step.choices = holder.getResult('flow-publish-dataset-version', []);
};

// Export Module

module.exports = new step(question);
