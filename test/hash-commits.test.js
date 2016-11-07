'use strict';

const chai = require('chai');
const expect = chai.expect;

const getCommitListTest = require('./../index.api.js');

const options = {
  repo: 'git@github.com:VS-work/ddf--ws-testing.git',
  login: 'dev@gapminder.org',
  pass: '123'
};

describe('hash commits', ()=> {

  it('should return correct hash commits', done=> {

    getCommitListTest.getCommitListByGithubUrl(options, function (err, commitsList) {

      expect(commitsList).to.be.instanceof(Array);
      expect(commitsList).to.have.lengthOf(4);
      expect(commitsList).to.deep.equal(['acd712c', '4e3a3fe', '4265f17', '193ae23']);

      commitsList.forEach(function (commit) {
        expect(commit).to.be.a('string').length(7);
      });

      done()
    });
  })
});