'use strict';

const cliApiImportUpdate = require('./api/import-update');
const cliApiSetDefault = require('./api/set-default');
const cliApiGetCommitList = require('./api/get-commit-list');
const cliApiGenerateDiff = require('./api/generate-diff');

module.exports = {
  importUpdate: cliApiImportUpdate,
  setDefault: cliApiSetDefault,
  generateDiff: cliApiGenerateDiff,
  getCommitListByGithubUrl: cliApiGetCommitList
};