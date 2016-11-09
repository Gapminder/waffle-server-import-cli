'use strict';

const cliApiImportUpdate = require('./api/import-update');
const cliApiSetDefault = require('./api/set-default');
const cliApiGetCommitList = require('./api/get-commit-list');

module.exports = {
  importUpdate: cliApiImportUpdate,
  setDefault: cliApiSetDefault,
  getCommitListByGithubUrl: cliApiGetCommitList
};