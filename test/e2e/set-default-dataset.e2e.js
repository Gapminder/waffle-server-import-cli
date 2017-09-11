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
  errors: {ERROR__CONNECTION_REFUSED},
  questions: {
    WAFFLE_SERVER_DEFAULT_DATASET_EMPTY_LIST,
    WAFFLE_SERVER_DEFAULT_DATASET_LIST,
    WAFFLE_SERVER_DEFAULT_DATASET_VERSIONS_LIST
  },
  answers: {
    ANSWER__WAFFLE_SERVER_DEFAULT_DATASET_LIST,
    ANSWER__WAFFLE_SERVER_DEFAULT_DATASET_VERSIONS_LIST
  },
  others: {
    CLI_RESULT_DELIMITER
  }
} = fixtures.messages;

const {
  waffleServerEndpoint,
  waffleServerSelectEndpoint,
  validLogin,
  answerLogin,
  validPassword,
  answerPassword,
  chooseFlow,
  setDefaultDataset,
  delimiter,
  anything
} = fixtures.getAppropriateSteps({ENTER, UP, DOWN});

const {
  setupResponseHandler,
  getExpectedErrorSteps,
  prettifyStdout,
  checkExpectedSteps,
  cliPath
} = require('./common');

describe('Set Default Dataset', () => {
  const expectedDefaultSteps = [
    ...waffleServerEndpoint,
    ...waffleServerSelectEndpoint,
    ...validLogin,
    ...answerLogin,
    ...validPassword,
    ...answerPassword,
    ...chooseFlow,
    ...setDefaultDataset
  ];

  const expectedAuthMiddlewareResponse = {
    'success': true,
    'data': {'token': 'AAAAAAAAAAAAAAAAAaaaaaaaaaaaaaaaaaaAAAAAAAAAAAAAA'}
  };

  describe('when WS server is down', () => {
    const app = express();
    const authMiddleware = sinon.stub();
    const closeExpressServerMiddleware = sinon.stub();
    setupResponseHandler(authMiddleware, expectedAuthMiddlewareResponse, 200);
    const handler = sinon.stub();
    let server;

    before(async () => {
      app.all('/api/ddf/cli/authenticate', authMiddleware, closeExpressServerMiddleware);
      app.all('/api/ddf/cli/datasets', handler);
      server = await app.listen(PORT);
      closeExpressServerMiddleware.callsFake((req, res, next) => {
        server.close();
        return next();
      });
    });

    afterEach(function () {
      handler.reset();
    });

    after(async () => {
      await server.close();
    });

    it('should respond with an error', async () => {
      // ARRANGE
      const expectedSteps = [
        ...expectedDefaultSteps,
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
    setupResponseHandler(authMiddleware, expectedAuthMiddlewareResponse, 200);
    const findDatasetMiddleware = sinon.stub();
    const setDefaultDatasetMiddleware = sinon.stub();
    let server;
    const expectedResponse = {
      'success': true,
      'data': [
        {
          'id': 'aaaa',
          'name': 'open-numbers/ddf--gapminder--systema_globalis',
          'path': 'git@github.com:open-numbers/ddf--gapminder--systema_globalis.git',
          'isDefault': false,
          'versions': [
            {
              'commit': 'aaaaaaa',
              'isDefault': false,
              'createdAt': '2017-06-27T00:00:00.000Z'
            },
            {
              'commit': 'bbbbbbb',
              'isDefault': false,
              'createdAt': '2017-06-30T00:00:00.000Z'
            }
          ]
        }, {
          'id': 'bbbb',
          'name': 'open-numbers/ddf--gapminder--systema_globalis#develop',
          'path': 'git@github.com:open-numbers/ddf--gapminder--systema_globalis.git#develop',
          'isDefault': false,
          'versions': [
            {
              'commit': 'f79d6eb',
              'isDefault': false,
              'createdAt': '2017-06-27T15:31:35.937Z'
            }
          ]
        }
      ]
    };

    before(async () => {
      app.all('/api/ddf/cli/authenticate', authMiddleware);
      app.all('/api/ddf/cli/datasets', findDatasetMiddleware);
      app.all('/api/ddf/cli/datasets/default', setDefaultDatasetMiddleware);

      server = await app.listen(PORT);
    });

    afterEach(function () {
      findDatasetMiddleware.reset();
      setDefaultDatasetMiddleware.reset();
    });

    after(async () => {
      authMiddleware.reset();
      await server.close();
    });

    it('should show empty dataset list', async () => {
      // ARRANGE
      const expectedSteps = [
        ...expectedDefaultSteps,
        {
          list: true,
          messageRegex: WAFFLE_SERVER_DEFAULT_DATASET_EMPTY_LIST
        }
      ];
      const keys = _.chain(expectedSteps).flatMap('keys').compact().value();
      const expectedEmptyResponse = {
        'success': true,
        'data': []
      };
      setupResponseHandler(findDatasetMiddleware, expectedEmptyResponse, 200);

      // ACT
      const stdout = await run(cliPath, keys);

      //  ASSERT
      const prettifiedSteps = prettifyStdout(stdout);
      checkExpectedSteps(expectedSteps, prettifiedSteps);
    });

    it('should show dataset list', async () => {
      // ARRANGE
      const expectedSteps = [
        ...expectedDefaultSteps,
        {
          keys: [ENTER],
          list: true,
          messageRegex: WAFFLE_SERVER_DEFAULT_DATASET_LIST
        }, {
          messageRegex: ANSWER__WAFFLE_SERVER_DEFAULT_DATASET_LIST
        }, {
          keys: [{key: ENTER, timeout: 2000}],
          list: true,
          messageRegex: WAFFLE_SERVER_DEFAULT_DATASET_VERSIONS_LIST
        }, {
          messageRegex: CLI_RESULT_DELIMITER
        }, {
          list: true,
          messageRegex: ANSWER__WAFFLE_SERVER_DEFAULT_DATASET_VERSIONS_LIST
        }
      ];
      const keys = _.chain(expectedSteps).flatMap('keys').compact().value();
      setupResponseHandler(findDatasetMiddleware, expectedResponse, 200);
      setupResponseHandler(setDefaultDatasetMiddleware, {
        'success': true,
        'data': {
          'name': 'open-numbers/ddf--gapminder--systema_globalis',
          'commit': 'aaaaaaa',
          'createdAt': '2017-06-27T00:00:00.000Z'
        }
      }, 200);

      // ACT
      const stdout = await run(cliPath, keys);

      //  ASSERT
      const prettifiedSteps = prettifyStdout(stdout);
      checkExpectedSteps(expectedSteps, prettifiedSteps);
    });
  });
});