'use strict';

var stepBase = require('./../model/base-step');
var util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

var question = {
  'name': 'flow-publish-dataset-version',
  'type': 'list',
  'message': 'Choose DataSet Version',
  'choices': []
};

/**************************************************************************************************************/

var holder = require('./../model/value-holder');
var request = require('request-defaults');

step.prototype.process = function (inputValue) {
  var done = this.async();

  var dataPublish = {
    'dataset_id': holder.get('flow-publish-dataset-non-published', false),
    'version': inputValue
  };

  request.api.post(
    'http://localhost:3010/publish-dataset',
    {form: dataPublish},
    function (error, response, body) {

      if (!error && response.statusCode == 200) {
        if(body && body.length) {
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

/**************************************************************************************************************/

module.exports = new step(question);
