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
  'name': 'way-import-translation-filesystem-datasets',
  'type': 'list',
  'message': 'Choose DataSet',
  'choices': []
};

// Own Process Implementation

const holder = require('./../../model/value-holder');
const request = require('request-defaults');

step.prototype.process = function (inputValue) {
  var done = this.async();

  var translationData = holder.getResult('translation-filesystem-data');
  var translationFile = holder.get('way-import-translation-filesystem-filelist');
  var translationId = translationFile.replace('.json', '');
  var dataSetId = inputValue;

  // 1 :: import translation

  request.api.post(
    'http://localhost:3010/translations-import',
    {
      body: {
        'language': translationId,
        'dataset_id': dataSetId,
        'data': translationData
      }
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {

        // 2 :: publish translation

        request.api.post(
          'http://localhost:3010/translations-publish',
          {
            body: {
              'dataset_id': dataSetId
            }
          },
          function (error, response, body) {
            if (!error && response.statusCode == 200) {
              done(null, true);
            } else {
              done(null, 'Server Error. Please try again later.');
            }
          }
        );

      } else {
        done(null, 'Server Error. Please try again later.');
      }
    }
  );
};

// Define Hook

step.prototype.prepare = function () {
  var prevStepResult = holder.getResult('translation-filesystem-datasets', []);
  this.step.choices = prevStepResult;
};

// Export Module

module.exports = new step(question);
