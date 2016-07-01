'use strict';

const holder = require('./model/value-holder');

// include static repos
let repoListReserved = require('./config/repositories');
holder.setResult('repository-list', repoListReserved);

// setup WS connection URL
// command line :: WS_URL=http://localhost:3001 npm start
let wsUrl = process.env.WS_URL ? process.env.WS_URL : 'http://localhost:3000';
holder.setResult('config-ws-url', wsUrl);

// require step definition
const stepScheme = require('./config/scheme.json');
const stepFlow = require('./service/step-runner');

// setup and run
let StepFlow = new stepFlow(stepScheme, holder);
StepFlow.run();