'use strict';

const _ = require('lodash');
const run = require('inquirer-test');
const {UP, DOWN, ENTER} = run;
const sinon = require('sinon');
const express = require('express');

const PORT = 3000;

const fixtures = require('./fixtures');

const {
  errors: {
    ERROR__CONNECTION_REFUSED,
    ERROR__WAFFLE_SERVER_ROLLBACK_TRANSACTION__NOT_FOUND_DATASET
  },
  questions: {
    WAFFLE_SERVER_ROLLBACK_TRANSACTION_REPO_LIST
  },
  answers: {
    ANSWER__ANYTHING
  },
} = fixtures.messages;

const {
  waffleServerEndpoint,
  waffleServerSelectEndpoint,
  validLogin,
  answerLogin,
  validPassword,
  answerPassword,
  chooseFlow,
  rollbackTransactionForDataset
} = fixtures.getAppropriateSteps({ENTER, UP, DOWN});

const {
  setupResponseHandler,
  getExpectedErrorSteps,
  prettifyStdout,
  checkExpectedSteps,
  cliPath
} = require('./common');

describe('Rollback transaction', () => {
  const expectedDefaultSteps = [
    ...waffleServerEndpoint,
    ...waffleServerSelectEndpoint,
    ...validLogin,
    ...answerLogin,
    ...validPassword,
    ...answerPassword,
    ...chooseFlow,
    ...rollbackTransactionForDataset
  ];
  
  const expectedAuthMiddlewareResponse = {
    'success': true,
    'data': {'token': 'AAAAAAAAAAAAAAAAAaaaaaaaaaaaaaaaaaaAAAAAAAAAAAAAA'}
  };
  
  describe('when WS server is down', () => {
    const app = express();
    const authMiddleware = sinon.stub();
    const rollbackMiddleware = sinon.stub();
    const closeExpressServerMiddleware = sinon.stub();
    setupResponseHandler(authMiddleware, expectedAuthMiddlewareResponse, 200);
    let server;
    
    before(async () => {
      app.all('/api/ddf/cli/authenticate', authMiddleware, closeExpressServerMiddleware);
      app.all('/api/ddf/cli/transactions/latest/rollback', rollbackMiddleware);
      server = await app.listen(PORT);
      closeExpressServerMiddleware.callsFake((req, res, next) => {
        server.close();
        return next();
      });
    });
    
    after(async () => {
      await server.close();
    });
    
    it('should respond with an connection refused error', async () => {
      // ARRANGE
      const expectedSteps = [
        ...expectedDefaultSteps,
        {
          keys: [ENTER],
          messageRegex: WAFFLE_SERVER_ROLLBACK_TRANSACTION_REPO_LIST
        },
        {
          messageRegex: ANSWER__ANYTHING
        },
        ...getExpectedErrorSteps(ERROR__CONNECTION_REFUSED)
      ];
      const keys = _.chain(expectedSteps).flatMap('keys').compact().value();
      
      // ACT
      const stdout = await run(cliPath, keys);
      
      //  ASSERT
      const prettifiedSteps = prettifyStdout(stdout);
      checkExpectedSteps(expectedSteps, prettifiedSteps);
    });
  });
  
  describe('with running WS server', () => {
    const app = express();
    const authMiddleware = sinon.stub();
    const rollbackMiddleware = sinon.stub();
    setupResponseHandler(authMiddleware, expectedAuthMiddlewareResponse, 200);
    let server;
  
    before(async () => {
      app.all('/api/ddf/cli/authenticate', authMiddleware);
      app.all('/api/ddf/cli/transactions/latest/rollback', rollbackMiddleware);
      server = await app.listen(PORT);
    });
  
    after(async () => {
      authMiddleware.reset();
      await server.close();
    });
  
    it('should respond with an error', async () => {
      // ARRANGE
      const expectRollbackMiddlewareResponse = {
        'success': false,
        'error': 'Dataset was not found for the given name'
      };
    
      setupResponseHandler(rollbackMiddleware, expectRollbackMiddlewareResponse, 200);
    
      const expectedSteps = [
        ...expectedDefaultSteps,
        {
          keys: [ENTER],
          messageRegex: WAFFLE_SERVER_ROLLBACK_TRANSACTION_REPO_LIST
        },
        {
          messageRegex: ANSWER__ANYTHING
        },
        ...getExpectedErrorSteps(ERROR__WAFFLE_SERVER_ROLLBACK_TRANSACTION__NOT_FOUND_DATASET),
    
      ];
      const keys = _.chain(expectedSteps).flatMap('keys').compact().value();
    
      // ACT
      const stdout = await run(cliPath, keys);
    
      //  ASSERT
      const prettifiedSteps = prettifyStdout(stdout);
    
      checkExpectedSteps(expectedSteps, prettifiedSteps);
    });
  
    it('should rollback transaction successfully', async () => {
      // ARRANGE
      const expectRollbackMiddlewareResponse = {
        'success': true,
        'message': 'Rollback completed successfully'
      };
    
      setupResponseHandler(rollbackMiddleware, expectRollbackMiddlewareResponse, 200);
    
      const expectedSteps = [
        ...expectedDefaultSteps,
        {
          keys: [ENTER],
          messageRegex: WAFFLE_SERVER_ROLLBACK_TRANSACTION_REPO_LIST
        },
        {
          messageRegex: ANSWER__ANYTHING
        },
        {
          messageRegex: /Rollback completed successfully/
        },
    
      ];
      const keys = _.chain(expectedSteps).flatMap('keys').compact().value();
    
      // ACT
      const stdout = await run(cliPath, keys);
    
      //  ASSERT
      const prettifiedSteps = prettifyStdout(stdout);
    
      checkExpectedSteps(expectedSteps, prettifiedSteps);
    });
  })
});
