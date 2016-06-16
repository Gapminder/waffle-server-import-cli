'use strict';

let stepScheme = require('./config/scheme.json');
let stepFlow = require('./service/step-runner');
let holder = require('./model/value-holder');

// include static repos
let repoListReserved = require('./config/repositories');
holder.setResult('repository-list', repoListReserved);

// setup and run
let StepFlow = new stepFlow(stepScheme, holder);
StepFlow.run();