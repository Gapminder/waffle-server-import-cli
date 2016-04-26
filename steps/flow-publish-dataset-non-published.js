'use strict';

var stepBase = require('./../model/base-step');
var util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

var question = {
  'name': 'flow-publish-dataset-non-published',
  'type': 'list',
  'message': 'Choose Non-Published DataSet',
  'choices': []
};

/**************************************************************************************************************/

var holder = require('./../model/value-holder');
var request = require('request');

step.prototype.process = function (inputValue) {
  var done = this.async();

  var dataNonPublished = {
    'dataset_id': inputValue
  };

  request.post(
    'http://localhost:3010/get-data-set-non-published-version',
    {form: dataNonPublished},
    function (error, response, body) {

      if (!error && response.statusCode == 200) {
        if(body && body.length) {
          var datasetsVersions = JSON.parse(body);
          holder.setResult('flow-publish-dataset-version', datasetsVersions.list);
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

/**************************************************************************************************************/

module.exports = new step(question);
