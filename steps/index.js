'use strict';

let authenticationLogin = require('./authentication-login');
let authenticationPassword = require('./authentication-password');
let chooseFlow = require('./choose-flow');
let datasetChooseImport = require('./dataset-choose-import');
let datasetChooseImportHash = require('./dataset-choose-import-hash');
let datasetChooseUpdate = require('./dataset-choose-update');
let datasetChooseUpdateHash = require('./dataset-choose-update-hash');
let registerRepository = require('./register-repository');
let datasetChooseCheckState = require('./dataset-choose-check-state');
let datasetChooseRollback = require('./dataset-choose-rollback');
let datasetChooseDefault = require('./dataset-choose-default');
let datasetChooseDefaultVersion = require('./dataset-choose-default-version');

let steps = {};

steps[authenticationLogin.getName()] = authenticationLogin;
steps[authenticationPassword.getName()] = authenticationPassword;
steps[chooseFlow.getName()] = chooseFlow;
steps[datasetChooseImport.getName()] = datasetChooseImport;
steps[datasetChooseUpdate.getName()] = datasetChooseUpdate;
steps[registerRepository.getName()] = registerRepository;
steps[datasetChooseImportHash.getName()] = datasetChooseImportHash;
steps[datasetChooseUpdateHash.getName()] = datasetChooseUpdateHash;
steps[datasetChooseCheckState.getName()] = datasetChooseCheckState;
steps[datasetChooseRollback.getName()] = datasetChooseRollback;
steps[datasetChooseDefault.getName()] = datasetChooseDefault;
steps[datasetChooseDefaultVersion.getName()] = datasetChooseDefaultVersion;

module.exports = steps;