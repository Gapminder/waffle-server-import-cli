'use strict';

var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;

const gitFlow = require('../../../service/git-flow');
const getCommitListTest = require('../../../index.api.js');

describe('Verify hash commits', function() {

  it('should return correct hash commits', sinon.test(function(done) {
    const commitsListFixture = [{
      date: 456,
      hash: 'bbbbbbb'
    }, {
      date: 123,
      hash: 'ccccccc'
    }, {
      date: 789,
      hash: 'aaaaaaa'
    }];

    const gitFlowStub = this.stub(gitFlow, 'getCommitList').callsArgWithAsync(1, null, commitsListFixture);
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';

    return getCommitListTest.getCommitListByGithubUrl(githubUrl, function (err, commits) {
      sinon.assert.calledOnce(gitFlowStub);
      sinon.assert.calledWithExactly(gitFlowStub, githubUrl, sinon.match.func);

      expect(commits).to.be.deep.equal(['ccccccc', 'bbbbbbb', 'aaaaaaa']);

      return done();
    });
  }));
});