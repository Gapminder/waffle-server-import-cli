'use strict';

var stepBase = require('./../model/base-step');
var util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

var question = {
  'name': 'authentification-login',
  'type': 'input',
  'default': 'test',
  'message': 'Authentification, Login'
};

/**************************************************************************************************************/

step.prototype.process = function (inputValue) {
  var done = this.async();
  setTimeout(function () {
    if(inputValue == 'test') {
      done(null, true);
    } else {
      done(null, false);
    }
  }, 100);
};


/**************************************************************************************************************/

module.exports = new step(question);