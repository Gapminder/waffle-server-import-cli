'use strict';

const cliApiImportUpdate = require('./api/import-update');
const cliApiSetDefault = require('./api/set-default');

module.exports = {
  importUpdate: cliApiImportUpdate,
  setDefault: cliApiSetDefault
};