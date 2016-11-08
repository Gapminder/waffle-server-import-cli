'use strict';

const chai = require('chai');
const expect = chai.expect;

const getCommitListTest = require('./../index.api.js');

describe('hash commits', ()=> {

  it('should return correct hash commits', done=> {

    const options = {
      repo: 'git@github.com:VS-work/ddf--ws-testing.git',
    };

    getCommitListTest.getCommitListByGithubUrl(options, function (err, commits) {

      expect(commits).to.be.instanceof(Array);
      expect(commits).to.have.length.above(3);

      commits.forEach(function (commit) {
        expect(commit).to.be.a('string').length(7);
      });

      done()
    });
  })
});