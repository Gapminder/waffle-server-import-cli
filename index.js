'use strict';

let request = require('request-defaults');
request.api = request.defaults({
  // 24 hours
  timeout: 24*60*60*1000,
  // timeout: false, not working, default value 120 seconds
  json: true
});

let stepScheme = require('./config/scheme.json');
let stepFlow = require('./service/step-runner');



// TEMP include static repos
let holder = require('./model/value-holder');
let repoListReserved = require('./config/repositories');
holder.setResult('repository-list', repoListReserved);


let StepFlow = new stepFlow(stepScheme, holder);
StepFlow.run();