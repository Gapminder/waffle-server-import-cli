'use strict';

const repoService = require('waffle-server-repo-service').default;
repoService.logger = require('./config/logger');

const cliApiImportUpdate = require('./api/import-update');
const cliApiSetDefault = require('./api/set-default');
const cliApiGetCommitList = require('./api/get-commit-list');
const cliApiGenerateDiff = require('./api/generate-diff');
const cliApiCleanRepos = require('./api/clean-repos');

module.exports = {
  importUpdate: cliApiImportUpdate,
  setDefault: cliApiSetDefault,
  generateDiff: cliApiGenerateDiff,
  getCommitListByGithubUrl: cliApiGetCommitList,
  cleanRepos: cliApiCleanRepos
};