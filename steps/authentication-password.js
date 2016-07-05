'use strict';

const stepBase = require('./../model/base-step');
const util = require('util');
const cliUi = require('./../service/cli-ui');
const inquirer = require('inquirer');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

// Question Definition

let question = {
  'name': 'authentication-password',
  'type': 'password',
  'default': '123',
  'message': 'Authentication, Password'
};

// Own Process Implementation

const wsRequest = require('./../service/request-ws');

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing user password");

  let data = {
    email: stepInstance.holder.get('authentication-login', ''),
    password: inputValue
  };

  wsRequest.authenticate(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      cliUi.stop().logStart().error(errorMsg).logEnd();
      stepInstance.setNextDynamic('authentication-login');
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    let responseData = wsResponse.getData();

    stepInstance.holder.setResult('auth', responseData);
    stepInstance.setNextDynamic(false);

    cliUi.stop();
    done(null, true);
  });

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;