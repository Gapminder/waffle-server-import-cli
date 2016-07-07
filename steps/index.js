'use strict';

const wsChoose = require('./ws-choose');
const wsListAdd = require('./ws-list-add');
const wsListChoose = require('./ws-list-choose');
const authenticationLogin = require('./authentication-login');
const authenticationPassword = require('./authentication-password');
const chooseFlow = require('./choose-flow');
const datasetChooseImport = require('./dataset-choose-import');
const datasetChooseImportHash = require('./dataset-choose-import-hash');
const datasetChooseUpdate = require('./dataset-choose-update');
const datasetChooseUpdateHash = require('./dataset-choose-update-hash');
const registerRepository = require('./register-repository');
const datasetChooseCheckState = require('./dataset-choose-check-state');
const datasetChooseRollback = require('./dataset-choose-rollback');
const datasetChooseDefault = require('./dataset-choose-default');
const datasetChooseDefaultVersion = require('./dataset-choose-default-version');

let steps = {};

steps[wsChoose.getName()] = wsChoose;
steps[wsListAdd.getName()] = wsListAdd;
steps[wsListChoose.getName()] = wsListChoose;
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