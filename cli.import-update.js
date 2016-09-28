'use strict';

/**
 *
 * Usage (change Password):
 *
 * FROM=1cdc5db TO=fe9fd41 REPO=git@github.com:VS-work/ddf-gapminder-world-stub-4-validated.git LOGIN=dev@gapminder.org PASS=*** npm run api:import-update
 *
 **/

const cliApiImportUpdate = require('./api/import-update');

const options = {
  repo: process.env.REPO || false,
  from: process.env.FROM || false,
  to: process.env.TO || false,
  login: process.env.LOGIN || false,
  pass: process.env.PASS || false,
  ws_host: process.env.WS_HOST || false,
  ws_port: process.env.WS_PORT || false
};

cliApiImportUpdate(options, function(error){
  process.exit(0);
});