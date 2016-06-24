'use strict';

const stepScheme = require('./config/scheme.json');
const stepFlow = require('./service/step-runner');
const holder = require('./model/value-holder');

// include static repos
let repoListReserved = require('./config/repositories');
holder.setResult('repository-list', repoListReserved);

// setup and run
let StepFlow = new stepFlow(stepScheme, holder);
StepFlow.run();