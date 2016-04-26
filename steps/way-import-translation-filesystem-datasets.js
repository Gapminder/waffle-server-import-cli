'use strict';

var stepBase = require('./../model/base-step');
var util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

var question = {
  'name': 'way-import-translation-filesystem-datasets',
  'type': 'list',
  'message': 'Choose DataSet',
  'choices': []
};

/**************************************************************************************************************/

var holder = require('./../model/value-holder');
var request = require('request');

step.prototype.process = function (inputValue) {
  var done = this.async();

  var translationData = holder.getResult('translation-filesystem-data');
  var translationFile = holder.get('way-import-translation-filesystem-filelist');
  var translationId = translationFile.replace('.json', '');
  var dataSetId = inputValue;

  var dataImport = {
    'language': translationId,
    'dataset_id': dataSetId,
    'data': translationData
  };

  // 1 :: import translation

  request.post(
    'http://localhost:3010/translations-import',
    {form: dataImport},
    function (error, response, body) {
      if (!error && response.statusCode == 200) {

        // 2 :: publish translation

        var dataPublish = {
          'dataset_id': dataSetId
        };

        request.post(
          'http://localhost:3010/translations-publish',
          {form: dataPublish},
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

/**************************************************************************************************************/

module.exports = new step(question);
