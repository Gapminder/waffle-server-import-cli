'use strict';

const getCommitListTest = require('./index.api');

const options = {
  repo: 'git@github.com:VS-work/ddf--ws-testing.git',
  login: 'dev@gapminder.org',
  pass: '123'
};

getCommitListTest.getCommitListByGithubUrl(options, function(){
  console.log("Done!");
});
