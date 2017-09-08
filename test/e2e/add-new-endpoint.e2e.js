'use strict';

const _ = require('lodash');
const async = require('async');
const run = require('inquirer-test');
const {UP, DOWN, ENTER} = run;
const path = require('path');

const fixtures = require('./fixtures');

const {
  errors: {ERROR__WAFFLE_SERVER_ENDPOINT__ADD_NEW_ENDPOINT},
  questions: {
      WAFFLE_SERVER_ENDPOINT,
      WAFFLE_SERVER_ADD_NEW_ENDPOINT,
      WAFFLE_SERVER_ADD_NEW_ENDPOINT_SELECTED
  },
  answers: {
      ANSWER__WAFFLE_SERVER_ENDPOINT__SELECT_FROM_THE_LIST,
      ANSWER__WAFFLE_SERVER_ENDPOINT__ADD_NEW_ENDPOINT
  }
} = fixtures.messages;

const {
  getExpectedErrorSteps,
  prettifyStdout,
  checkExpectedSteps,
  readEndpoints,
  filterTestEndpoint,
  writeEndpoints
} = require('./common');

const cliPath = path.resolve(__dirname, '../../');

describe('Add new Endpoint', () => {
   const newValidEndpoint ='http://valid-endpoint.new:1234';
   const newInvalidEndpoint ='invalidEndpoint';
   const defaultAddNewEndpointSteps = [
       {
           keys: [ DOWN, ENTER ],
           messageRegex: WAFFLE_SERVER_ENDPOINT
       },
       {
           messageRegex: WAFFLE_SERVER_ENDPOINT
       },
       {
           list: true,
           messageRegex:  WAFFLE_SERVER_ADD_NEW_ENDPOINT_SELECTED
       },
       {
           messageRegex: ANSWER__WAFFLE_SERVER_ENDPOINT__ADD_NEW_ENDPOINT
       },
       {
           messageRegex:WAFFLE_SERVER_ADD_NEW_ENDPOINT
       },
       {
           messageRegex: WAFFLE_SERVER_ADD_NEW_ENDPOINT
       }
   ];

   beforeEach((done) => {
       async.waterfall([
           async.constant({filteredObject: {url: newValidEndpoint}}),
           readEndpoints,
           filterTestEndpoint,
           writeEndpoints
       ], err => {
           done(err)
       });
   });

   after((done) => {
       async.waterfall([
           async.constant({filteredObject: {url: newValidEndpoint}}),
           readEndpoints,
           filterTestEndpoint,
           writeEndpoints
       ], err => {
           done(err)
       });
   });

   it('should respond with an error', async () => {
       // ARRANGE
       const expectedSteps = [
           ...defaultAddNewEndpointSteps,
           {
               keys: [ newInvalidEndpoint, ENTER ],
               homotypic: true,
               messageRegex:  WAFFLE_SERVER_ADD_NEW_ENDPOINT
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
               keys: [ newValidEndpoint, ENTER ],
               homotypic: true,
               messageRegex:  WAFFLE_SERVER_ADD_NEW_ENDPOINT
           },
           {
               messageRegex: WAFFLE_SERVER_ENDPOINT
           },
           {
               keys: [ ENTER ],
               messageRegex:  ANSWER__WAFFLE_SERVER_ENDPOINT__SELECT_FROM_THE_LIST
           },
           {
               list: true,
               messageRegex: new RegExp(newValidEndpoint, 'gm')
           },
       ];
       const keys = _.chain(expectedSteps).flatMap('keys').compact().value();

       // ACT
       const stdout = await run(cliPath, keys);

       //  ASSERT
       const prettifiedSteps = prettifyStdout(stdout);

       checkExpectedSteps(expectedSteps, prettifiedSteps);
   });
});