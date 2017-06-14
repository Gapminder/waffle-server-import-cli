'use strict';

// setup application environment
require('./service/env-init');
const envConst = require('./model/env-const');

const holder = require('./model/value-holder');

const repoService = require('waffle-server-repo-service').default;
repoService.logger = require('./config/logger');

// include static repositories
let repoListReserved = require(envConst.PATH_FILE_REPOS);
holder.save('repository-list', repoListReserved);

// include static waffle server sources
let wsListReserved = require(envConst.PATH_FILE_WS);
holder.save('waffle-server-list', wsListReserved);

// require step definition
const stepScheme = require('./config/scheme.json');
const stepFlow = require('./service/step-runner');

// setup and run
let StepFlow = new stepFlow(stepScheme, holder);
StepFlow.run();