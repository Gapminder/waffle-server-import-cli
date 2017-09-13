'use strict';

const _ = require('lodash');
const run = require('inquirer-test');
const chai = require('chai');
const expect = chai.expect;
const {UP, DOWN, ENTER} = run;
const sinon = require('sinon');
const express = require('express');

const PORT = 3000;

const fixtures = require('./fixtures');
const REPO_LIST_PATH = 'config/repositories.json';

const {
  errors: {
    ERROR__WAFFLE_SERVER_ENDPOINT__ADD_NEW_REPO
  },
  questions: {
    WAFFLE_SERVER_CHOOSE_FLOW,
    WAFFLE_SERVER_REGISTER_REPO,
    WAFFLE_SERVER_CHOOSE_FLOW_REGISTER_REPO,
    WAFFLE_SERVER_CHOOSE_FLOW_IMPORT_DATASET
  },
  answers: {
    ANSWER__ANYTHING
  },
  menuItems: {
    MENU_ITEM__WAFFLE_SERVER_REGISTER_NEW_REPO,
    MENU_ITEM__WAFFLE_SERVER_IMPORT_DATASET
  }
} = fixtures.messages;

const {
  waffleServerEndpoint,
  waffleServerSelectEndpoint,
  validLogin,
  answerLogin,
  validPassword,
  answerPassword,
  chooseFlow
} = fixtures.getAppropriateSteps({ENTER, UP, DOWN});

const {
  setupResponseHandler,
  getExpectedErrorSteps,
  prettifyStdout,
  checkExpectedSteps,
  clearFileFromTestedData,
  readFile,
  cliPath
} = require('./common');

describe('Register new repository', () => {
  const expectedDefaultSteps = [
    ...waffleServerEndpoint,
    ...waffleServerSelectEndpoint,
    ...validLogin,
    ...answerLogin,
    ...validPassword,
    ...answerPassword,
    ...chooseFlow,
    {
      keys: [DOWN],
      messageRegex: WAFFLE_SERVER_CHOOSE_FLOW
    },
    {
      list: true,
      messageRegex: MENU_ITEM__WAFFLE_SERVER_REGISTER_NEW_REPO
    },
    {
      keys: [ENTER],
      messageRegex: WAFFLE_SERVER_CHOOSE_FLOW_REGISTER_REPO
    },
    {
      messageRegex: WAFFLE_SERVER_REGISTER_REPO
    }
  ];
  
  const expectedAuthMiddlewareResponse = {
    'success': true,
    'data': {'token': 'AAAAAAAAAAAAAAAAAaaaaaaaaaaaaaaaaaaAAAAAAAAAAAAAA'}
  };
  const newValidRepo = 'git@github.com:VS-work/ddf--ws-testing.git';
  
  const app = express();
  const authMiddleware = sinon.stub();
  setupResponseHandler(authMiddleware, expectedAuthMiddlewareResponse, 200);
  let server;
  
  before(async () => {
    app.all('/api/ddf/cli/authenticate', authMiddleware);
    server = await app.listen(PORT);
  });
  
  beforeEach((done) => {
    clearFileFromTestedData({pathToFile: REPO_LIST_PATH, filteredObject: {github: newValidRepo}}, done);
  });
  
  afterEach((done) => {
    clearFileFromTestedData({pathToFile: REPO_LIST_PATH, filteredObject: {github: newValidRepo}}, done);
  });
  
  after(async () => {
    authMiddleware.reset();
    await server.close();
  });
  
  it('should respond with an error', async () => {
    // ARRANGE
    const newInvalidRepository = 'invalidRepository';
    const expectedSteps = [
      ...expectedDefaultSteps,
      {
        keys: [newInvalidRepository, ENTER],
        sameType: true,
        messageRegex: WAFFLE_SERVER_REGISTER_REPO
      },
      {
        messageRegex: WAFFLE_SERVER_REGISTER_REPO
      },
      ...getExpectedErrorSteps(ERROR__WAFFLE_SERVER_ENDPOINT__ADD_NEW_REPO)
    ];
    const keys = _.chain(expectedSteps).flatMap('keys').compact().value();
    
    // ACT
    const stdout = await run(cliPath, keys);
    
    //  ASSERT
    const prettifiedSteps = prettifyStdout(stdout);
    
    checkExpectedSteps(expectedSteps, prettifiedSteps);
  });
  
  it('should add new repository', async () => {
    // ARRANGE
    const expectedSteps = [
      ...expectedDefaultSteps,
      {
        keys: [newValidRepo, ENTER],
        sameType: true,
        messageRegex: WAFFLE_SERVER_REGISTER_REPO
      },
      {
        messageRegex: WAFFLE_SERVER_REGISTER_REPO
      },
      {
        messageRegex: WAFFLE_SERVER_CHOOSE_FLOW
      },
      {
        keys: [DOWN],
        messageRegex: WAFFLE_SERVER_CHOOSE_FLOW
      },
      {
        keys: [DOWN],
        list: true,
        messageRegex: MENU_ITEM__WAFFLE_SERVER_REGISTER_NEW_REPO
      },
      {
        messageRegex: WAFFLE_SERVER_CHOOSE_FLOW
      },
      {
        keys: [ENTER],
        list: true,
        messageRegex: MENU_ITEM__WAFFLE_SERVER_IMPORT_DATASET
      },
      {
        messageRegex: WAFFLE_SERVER_CHOOSE_FLOW_IMPORT_DATASET
      },
      {
        list: true,
        messageRegex: new RegExp(newValidRepo, 'gm')
      }
    ];
    const keys = _.chain(expectedSteps).flatMap('keys').compact().value();
    
    // ACT
    const stdout = await run(cliPath, keys);
    
    //  ASSERT
    const prettifiedSteps = prettifyStdout(stdout);
    
    checkExpectedSteps(expectedSteps, prettifiedSteps);
  });
  
  it('should not add existed repository as new', async () => {
    const existedRepo = 'git@github.com:open-numbers/ddf--gapminder--population.git#develop';
    const expectedSteps = [
      ...expectedDefaultSteps,
      {
        keys: [existedRepo, ENTER],
        sameType: true,
        messageRegex: WAFFLE_SERVER_REGISTER_REPO
      }
    ];
    const keys = _.chain(expectedSteps).flatMap('keys').compact().value();
    
    // ACT
    const stdout = await run(cliPath, keys);
    
    //  ASSERT
    const prettifiedSteps = prettifyStdout(stdout);
    const fileContent = await readFile(REPO_LIST_PATH);
    
    const existedListLength = _.filter(fileContent, {github: existedRepo}).length;
    
    expect(existedListLength).to.equal(1);
    checkExpectedSteps(expectedSteps, prettifiedSteps);
  });
});