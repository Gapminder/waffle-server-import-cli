'use strict';

/**
 *
 * Usage (change Password):
 *
 * FROM=66a50bb TO=5166a22 REPO=git@github.com:VS-work/ddf--ws-testing.git npm run api:diff
 *
 **/

const cliApiGenerateDiff = require('./api/generate-diff');

const options = {
  github: process.env.REPO || false,
  hashFrom: process.env.FROM || false,
  hashTo: process.env.TO || false
};

cliApiGenerateDiff(options, function(error){
  process.exit(0);
});