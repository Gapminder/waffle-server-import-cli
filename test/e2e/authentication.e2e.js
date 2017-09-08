'use strict';

const _ = require('lodash');
const run = require('inquirer-test');
const {UP, DOWN, ENTER} = run;
const path = require('path');
const sinon = require('sinon');
const express = require('express');

const PORT = 3000;

const fixtures = require('./fixtures');

const {
  ERROR__CONNECTION_REFUSED,
  ERROR__NO_EMAIL_WAS_PROVIDED,
  ERROR__NO_PASSWORD_WAS_PROVIDED,
  ERROR__PASSWORD_IS_WRONG
} = fixtures.messages.errors;

const {
  waffleServerEndpoint,
  waffleServerSelectEndpoint,
  validLogin,
  answerLogin,
  emptyLogin,
  validPassword,
  answerPassword,
  emptyPassword,
  chooseFlow,
  delimiter
} = fixtures.getAppropriateSteps({ENTER, UP, DOWN});

const {
  getExpectedErrorSteps,
  setupResponseHandler,
  prettifyStdout,
  checkExpectedSteps,
  cliPath
} = require('./common');

describe('Authentication', () => {
  const expectedDefaultSteps = [
    ...waffleServerEndpoint,
    ...waffleServerSelectEndpoint
  ];

  it('should respond with an error when WS server is down', async () => {
    // ARRANGE
    const expectedSteps = [
      ...expectedDefaultSteps,
      ...emptyLogin,
      ...emptyPassword,
      ...delimiter,
      ...getExpectedErrorSteps(ERROR__CONNECTION_REFUSED)
    ];
    const keys = _.chain(expectedSteps).flatMap('keys').compact().value();

    // ACT
    const stdout = await run(cliPath, keys);

    //  ASSERT
    const prettifiedSteps = prettifyStdout(stdout);
    checkExpectedSteps(expectedSteps, prettifiedSteps);
  });

  describe('with running WS server', () => {
    const app = express();
    const handler = sinon.stub();
    let server;

    before(async () => {
      app.all('/api/ddf/cli/authenticate', handler);
      server = await app.listen(PORT);
    });

    afterEach(function () {
      handler.reset();
    });

    after(async () => {
      await server.close();
    });

    it('should authenticate user', async () => {
      // ARRANGE
      const expectedResponse = {
        'success': true,
        'data': {'token': 'AAAAAAAAAAAAAAAAAaaaaaaaaaaaaaaaaaaAAAAAAAAAAAAAA'}
      };
      setupResponseHandler(handler, expectedResponse);
      const expectedSteps = [
        ...expectedDefaultSteps,
        ...validLogin,
        ...answerLogin,
        ...validPassword,
        ...answerPassword,
        ...chooseFlow
      ];
      const keys = _.chain(expectedSteps).flatMap('keys').compact().value();

      // ACT
      const stdout = await run(cliPath, keys);

      //  ASSERT
      const prettifiedSteps = prettifyStdout(stdout);
      checkExpectedSteps(expectedSteps, prettifiedSteps);
    });

    it('should respond with an error when login is empty', async () => {
      // ARRANGE
      const expectedResponse = {'success': false, 'error': 'User with an email: \'false\' was not found'};
      setupResponseHandler(handler, expectedResponse);
      const expectedSteps = [
        ...expectedDefaultSteps,
        ...emptyLogin,
        ...validPassword,
        ...delimiter,
        ...getExpectedErrorSteps(ERROR__NO_EMAIL_WAS_PROVIDED)
      ];
      const keys = _.chain(expectedSteps).flatMap('keys').compact().value();

      // ACT
      const stdout = await run(cliPath, keys);

      //  ASSERT
      const prettifiedSteps = prettifyStdout(stdout);
      checkExpectedSteps(expectedSteps, prettifiedSteps);
    });

    it('should respond with an error when password is empty', async () => {
      // ARRANGE
      const expectedResponse = {'success': false, 'error': 'Password was not provided'};
      setupResponseHandler(handler, expectedResponse);
      const expectedSteps = [
        ...expectedDefaultSteps,
        ...validLogin,
        ...answerLogin,
        ...emptyPassword,
        ...delimiter,
        ...getExpectedErrorSteps(ERROR__NO_PASSWORD_WAS_PROVIDED)
      ];
      const keys = _.chain(expectedSteps).flatMap('keys').compact().value();

      // ACT
      const stdout = await run(cliPath, keys);

      //  ASSERT
      const prettifiedSteps = prettifyStdout(stdout);
      checkExpectedSteps(expectedSteps, prettifiedSteps);
    });

    it('should respond with an error when password is wrong', async () => {
      // ARRANGE
      const expectedResponse = {'success': false, 'error': 'Password was not provided'};
      setupResponseHandler(handler, expectedResponse);
      const expectedSteps = [
        ...expectedDefaultSteps,
        ...validLogin,
        ...answerLogin,
        ...validPassword,
        ...delimiter,
        ...getExpectedErrorSteps(ERROR__NO_PASSWORD_WAS_PROVIDED)
      ];
      const keys = _.chain(expectedSteps).flatMap('keys').compact().value();

      // ACT
      const stdout = await run(cliPath, keys);

      //  ASSERT
      const prettifiedSteps = prettifyStdout(stdout);
      checkExpectedSteps(expectedSteps, prettifiedSteps);
    });
  });
});