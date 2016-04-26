'use strict';

var stepBase = require('./../model/base-step');
var util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

var question = {
  'name': 'way-import-translation-contentful-spaceid',
  'type': 'input',
  'message': 'Contentful asks for "SPACE_ID"'
};

/**************************************************************************************************************/

step.prototype.process = function (inputValue) {
  var done = this.async();
  setTimeout(function () {
    done(null, true);
  }, 100);
};

/**************************************************************************************************************/

module.exports = new step(question);
