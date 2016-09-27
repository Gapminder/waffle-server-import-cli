'use strict';

/**
 *
 * Usage (change Password):
 *
 * COMMIT=177cbf0 REPO=git@github.com:VS-work/ddf-gapminder-world-stub-4-validated.git LOGIN=dev@gapminder.org PASS=*** npm run api:set-default
 * COMMIT=63fdced REPO=git@github.com:VS-work/ddf-gapminder-world-stub-4-validated.git LOGIN=dev@gapminder.org PASS=*** npm run api:set-default
 *
 **/

const cliApiSetDefault = require('./api/set-default');

const options = {
  repo: process.env.REPO || false,
  commit: process.env.COMMIT || false,
  login: process.env.LOGIN || false,
  pass: process.env.PASS || false
};

cliApiSetDefault(options, function(error){
  process.exit(0);
});