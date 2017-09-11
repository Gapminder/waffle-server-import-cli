'use strict';

const _ = require('lodash');
const run = require('inquirer-test');
const chai = require('chai');
const expect = chai.expect;
const {UP, DOWN, ENTER} = run;

const fixtures = require('./fixtures');
const ENDPOINTS_LIST_PATH = 'config/waffle-server.json';

const {
  errors: {ERROR__WAFFLE_SERVER_ENDPOINT__ADD_NEW_ENDPOINT},
  questions: {
    WAFFLE_SERVER_ENDPOINT,
    WAFFLE_SERVER_ADD_NEW_ENDPOINT
  },
  answers: {
    ANSWER__WAFFLE_SERVER_ENDPOINT__SELECT_FROM_THE_LIST,
    ANSWER__WAFFLE_SERVER_ENDPOINT__ADD_NEW_ENDPOINT
  },
  menuItems: {
    MENU_ITEM__WAFFLE_SERVER_ADD_NEW_ENDPOINT
  }
} = fixtures.messages;

const {
  getExpectedErrorSteps,
  prettifyStdout,
  checkExpectedSteps,
  readFile,
  clearFileFromTestedData,
  cliPath
} = require('./common');

describe('Add new Endpoint', () => {
  const newValidEndpoint = 'http://valid-endpoint.new:1234';
  const defaultAddNewEndpointSteps = [
    {
      keys: [DOWN, ENTER],
      messageRegex: WAFFLE_SERVER_ENDPOINT
    },
    {
      messageRegex: WAFFLE_SERVER_ENDPOINT
    },
    {
      list: true,
      messageRegex: MENU_ITEM__WAFFLE_SERVER_ADD_NEW_ENDPOINT
    },
    {
      messageRegex: ANSWER__WAFFLE_SERVER_ENDPOINT__ADD_NEW_ENDPOINT
    },
    {
      messageRegex: WAFFLE_SERVER_ADD_NEW_ENDPOINT
    },
    {
      messageRegex: WAFFLE_SERVER_ADD_NEW_ENDPOINT
    }
  ];

  beforeEach((done) => {
    clearFileFromTestedData({pathToFile: ENDPOINTS_LIST_PATH, filteredObject: {url: newValidEndpoint}}, done);
  });

  afterEach((done) => {
    clearFileFromTestedData({pathToFile: ENDPOINTS_LIST_PATH, filteredObject: {url: newValidEndpoint}}, done);
  });

  it('should respond with an error', async () => {
    // ARRANGE
    const newInvalidEndpoint = 'invalidEndpoint';
    const expectedSteps = [
      ...defaultAddNewEndpointSteps,
      {
        keys: [newInvalidEndpoint, ENTER],
        homotypic: true,
        messageRegex: WAFFLE_SERVER_ADD_NEW_ENDPOINT
      },
      ...getExpectedErrorSteps(ERROR__WAFFLE_SERVER_ENDPOINT__ADD_NEW_ENDPOINT)
    ];
    const keys = _.chain(expectedSteps).flatMap('keys').compact().value();

    // ACT
    const stdout = await run(cliPath, keys);

    //  ASSERT
    const prettifiedSteps = prettifyStdout(stdout);

    checkExpectedSteps(expectedSteps, prettifiedSteps);
  });

  it('should add new endpoint', async () => {
    // ARRANGE
    const expectedSteps = [
      ...defaultAddNewEndpointSteps,
      {
        keys: [newValidEndpoint, ENTER],
        homotypic: true,
        messageRegex: WAFFLE_SERVER_ADD_NEW_ENDPOINT
      },
      {
        messageRegex: WAFFLE_SERVER_ENDPOINT
      },
      {
        keys: [ENTER],
        messageRegex: ANSWER__WAFFLE_SERVER_ENDPOINT__SELECT_FROM_THE_LIST
      },
      {
        list: true,
        messageRegex: new RegExp(newValidEndpoint, 'gm')
      }
    ];
    const keys = _.chain(expectedSteps).flatMap('keys').compact().value();

    // ACT
    const stdout = await run(cliPath, keys);

    //  ASSERT
    const prettifiedSteps = prettifyStdout(stdout);

    checkExpectedSteps(expectedSteps, prettifiedSteps);
  });
  
  it('should not add existed endpoint as new', async () => {
    const existedEndpoint = 'http://localhost:3000';
    const expectedSteps = [
      ...defaultAddNewEndpointSteps,
      {
        keys: [existedEndpoint, ENTER],
        homotypic: true,
        messageRegex: WAFFLE_SERVER_ADD_NEW_ENDPOINT
      }
    ];
    const keys = _.chain(expectedSteps).flatMap('keys').compact().value();
    
    // ACT
    const stdout = await run(cliPath, keys);
    
    //  ASSERT
    const prettifiedSteps = prettifyStdout(stdout);
    const fileContent = await new Promise((resolve, reject) => {
      readFile({pathToFile: ENDPOINTS_LIST_PATH}, (err, result) => {
        if (err) {
          return reject(err);
        }
        
        return resolve(result.data);
      });
    });
    
    const existedListLength = _.filter(fileContent, {url: existedEndpoint}).length;
    
    expect(existedListLength).to.equal(1);
    checkExpectedSteps(expectedSteps, prettifiedSteps);
  });
});