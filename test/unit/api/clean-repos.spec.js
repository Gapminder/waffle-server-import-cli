'use strict';

const sinon = require('sinon');
const sinonTest = require("sinon-test");
sinon.test = sinonTest.configureTest(sinon);
sinon.testCase = sinonTest.configureTestCase(sinon);

const chai = require('chai');
const expect = chai.expect;

const sinonChai = require('sinon-chai');
const sinonChaiInOrder = require('sinon-chai-in-order');
chai.use(sinonChai);
chai.use(sinonChaiInOrder.default);

const gitFlow = require('../../../service/git-flow');
const getCommitListTest = require('../../../index.api');
const cliUi = require('../../../service/cli-ui');

describe('Clean repos', function() {

  it('should clean repos without error', sinon.test(function(done) {
    const gitFlowStub = this.stub(gitFlow, 'reposClean').callsArgWith(1, null);
    const cliUiStub = this.stub(cliUi, 'stop');
    const pathToRepos = 'test/';

    return getCommitListTest.cleanRepos(pathToRepos, function (error) {
      sinon.assert.calledOnce(gitFlowStub);
      sinon.assert.calledWithExactly(gitFlowStub, pathToRepos, sinon.match.func);
      sinon.assert.calledOnce(cliUiStub);
      sinon.assert.calledWithExactly(cliUiStub);

      expect(error).to.not.exist;

      return done();
    });
  }));

  it('should clean repos with error during cleaning repos', sinon.test(function(done) {
    const expectedError = 'Boo!';
    const gitFlowStub = this.stub(gitFlow, 'reposClean').callsArgWith(1, expectedError);
    const cliUiStub = this.stub(cliUi, 'stop');
    const pathToRepos = 'test/';

    return getCommitListTest.cleanRepos(pathToRepos, function (error) {
      sinon.assert.calledOnce(gitFlowStub);
      sinon.assert.calledWithExactly(gitFlowStub, pathToRepos, sinon.match.func);
      sinon.assert.calledOnce(cliUiStub);
      sinon.assert.calledWithExactly(cliUiStub);

      expect(error).to.be.equal(expectedError);

      return done();
    });
  }));

  it('should return error if path to repos is empty', sinon.test(function(done) {
    const expectedError = 'Path to repos folder was missed';
    const gitFlowStub = this.stub(gitFlow, 'reposClean').callsArgWith(1, expectedError);
    const cliUiStub = this.stub(cliUi, 'stop');
    const pathToRepos = null;

    return getCommitListTest.cleanRepos(pathToRepos, function (error) {
      sinon.assert.notCalled(gitFlowStub);
      sinon.assert.notCalled(cliUiStub);

      expect(error).to.be.equal(expectedError);

      return done();
    });
  }));
});