'use strict';

const util = require('util');
const cliUi = require('./../service/cli-ui');
const inquirer = require('inquirer');
const stepBase = require('./../model/base-step');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

// Question Definition

let question = {
  'name': 'authentication-password',
  'type': 'password',
  'message': 'Authentication, Password'
};

// Own Process Implementation

const wsRequest = require('./../service/request-ws');

const HOLDER_KEY_AUTH_LOGIN = 'authentication-login';
const HOLDER_KEY_TOKEN = 'auth-token';

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing user password");

  let data = {
    email: stepInstance.holder.get(HOLDER_KEY_AUTH_LOGIN, ''),
    password: inputValue
  };

  wsRequest.authenticate(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      cliUi.stop().logStart().error(errorMsg).logEnd();
      stepInstance.setNextDynamic(HOLDER_KEY_AUTH_LOGIN);
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    let responseData = wsResponse.getData();

    stepInstance.holder.save(HOLDER_KEY_TOKEN, responseData);
    stepInstance.setNextDynamic(false);

    cliUi.stop();
    done(null, true);
  });

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;