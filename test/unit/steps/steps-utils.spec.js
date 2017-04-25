'use strict';

const sinon = require('sinon');
const assert = sinon.assert;
const match = sinon.match;
const sinonTest = require('sinon-test');
sinon.test = sinonTest.configureTest(sinon);
sinon.testCase = sinonTest.configureTestCase(sinon);

const chai = require('chai');
const expect = chai.expect;

const sinonChai = require('sinon-chai');
const sinonChaiInOrder = require('sinon-chai-in-order');
chai.use(sinonChai);
chai.use(sinonChaiInOrder.default);

const stepsUtils = require('../../../steps/steps-utils');
const gitFlow = require('../../../service/git-flow');
const wsRequest = require('../../../service/request-ws');
const cliUi = require('../../../service/cli-ui');
const envConst = require('../../../model/env-const');

describe('Steps: Steps utils', function () {

  it('should run cleaning repos', sinon.test(function (done) {
    const gitFlowStub = this.stub(gitFlow, 'reposClean').yieldsAsync();
    const getErrorStub = this.stub().returns(null);
    const wsRequestStub = this.stub(wsRequest, 'reposClean').yieldsAsync(null, {getError: getErrorStub});

    const cliUiStopStub = this.stub(cliUi, 'stop').returnsThis();
    const cliUiLogStartStub = this.stub(cliUi, 'logStart').returnsThis();
    const cliUiErrorStub = this.stub(cliUi, 'error').returnsThis();
    const cliUiSuccessStub = this.stub(cliUi, 'success').returnsThis();
    const cliUiLogEndStub = this.stub(cliUi, 'logEnd').returnsThis();

    const expectedMessage = '* Repos removed successfully!';

    return stepsUtils.reposClean((error, result) => {
      expect(error).to.not.exist;
      expect(result).to.be.ok;

      assert.calledOnce(gitFlowStub);
      assert.alwaysCalledWithExactly(gitFlowStub, envConst.PATH_REPOS, match.func);

      assert.calledOnce(getErrorStub);
      assert.alwaysCalledWithExactly(getErrorStub);

      assert.calledOnce(wsRequestStub);
      assert.alwaysCalledWithExactly(wsRequestStub, {}, match.func);

      assert.calledOnce(cliUiStopStub);
      assert.alwaysCalledWithExactly(cliUiStopStub);

      assert.calledOnce(cliUiLogStartStub);
      assert.alwaysCalledWithExactly(cliUiLogStartStub);

      assert.calledOnce(cliUiSuccessStub);
      assert.alwaysCalledWithExactly(cliUiSuccessStub, expectedMessage);

      assert.calledOnce(cliUiLogEndStub);
      assert.alwaysCalledWithExactly(cliUiLogEndStub);

      assert.notCalled(cliUiErrorStub);

      return done();
    });
  }));

  it('should print error in console if it happens during cleaning local repos', sinon.test(function (done) {
    const expectedError = 'Boo!';
    const gitFlowStub = this.stub(gitFlow, 'reposClean').yieldsAsync(expectedError);
    const getErrorStub = this.stub().returns(null);
    const wsRequestStub = this.stub(wsRequest, 'reposClean').yieldsAsync(null, {getError: getErrorStub});

    const cliUiStopStub = this.stub(cliUi, 'stop').returnsThis();
    const cliUiLogStartStub = this.stub(cliUi, 'logStart').returnsThis();
    const cliUiErrorStub = this.stub(cliUi, 'error').returnsThis();
    const cliUiSuccessStub = this.stub(cliUi, 'success').returnsThis();
    const cliUiLogEndStub = this.stub(cliUi, 'logEnd').returnsThis();

    return stepsUtils.reposClean((error, result) => {
      expect(error).to.not.exist;
      expect(result).to.be.ok;

      assert.calledOnce(gitFlowStub);
      assert.alwaysCalledWithExactly(gitFlowStub, envConst.PATH_REPOS, match.func);

      assert.calledOnce(cliUiStopStub);
      assert.alwaysCalledWithExactly(cliUiStopStub);

      assert.calledOnce(cliUiLogStartStub);
      assert.alwaysCalledWithExactly(cliUiLogStartStub);

      assert.calledOnce(cliUiErrorStub);
      assert.alwaysCalledWithExactly(cliUiErrorStub, expectedError);

      assert.calledOnce(cliUiLogEndStub);
      assert.alwaysCalledWithExactly(cliUiLogEndStub);

      assert.notCalled(getErrorStub);
      assert.notCalled(wsRequestStub);
      assert.notCalled(cliUiSuccessStub);

      return done();
    });
  }));

  it('should print error in console if it happens during connection to WS', sinon.test(function (done) {
    const expectedError = 'Boo!';
    const gitFlowStub = this.stub(gitFlow, 'reposClean').yieldsAsync();
    const getErrorStub = this.stub().returns(null);
    const wsRequestStub = this.stub(wsRequest, 'reposClean').yieldsAsync(expectedError, {getError: getErrorStub});

    const cliUiStopStub = this.stub(cliUi, 'stop').returnsThis();
    const cliUiLogStartStub = this.stub(cliUi, 'logStart').returnsThis();
    const cliUiErrorStub = this.stub(cliUi, 'error').returnsThis();
    const cliUiSuccessStub = this.stub(cliUi, 'success').returnsThis();
    const cliUiLogEndStub = this.stub(cliUi, 'logEnd').returnsThis();

    return stepsUtils.reposClean((error, result) => {
      expect(error).to.not.exist;
      expect(result).to.be.ok;

      assert.calledOnce(gitFlowStub);
      assert.alwaysCalledWithExactly(gitFlowStub, envConst.PATH_REPOS, match.func);

      assert.calledOnce(wsRequestStub);
      assert.alwaysCalledWithExactly(wsRequestStub, {}, match.func);

      assert.calledOnce(cliUiStopStub);
      assert.alwaysCalledWithExactly(cliUiStopStub);

      assert.calledOnce(cliUiLogStartStub);
      assert.alwaysCalledWithExactly(cliUiLogStartStub);

      assert.calledOnce(cliUiErrorStub);
      assert.alwaysCalledWithExactly(cliUiErrorStub, expectedError);

      assert.calledOnce(cliUiLogEndStub);
      assert.alwaysCalledWithExactly(cliUiLogEndStub);

      assert.notCalled(getErrorStub);
      assert.notCalled(cliUiSuccessStub);

      return done();
    });
  }));

  it('should print error in console if it happens during cleaning WS repos', sinon.test(function (done) {
    const expectedError = 'Boo!';
    const gitFlowStub = this.stub(gitFlow, 'reposClean').yieldsAsync();
    const getErrorStub = this.stub().returns(expectedError);
    const wsRequestStub = this.stub(wsRequest, 'reposClean').yieldsAsync(null, {getError: getErrorStub});

    const cliUiStopStub = this.stub(cliUi, 'stop').returnsThis();
    const cliUiLogStartStub = this.stub(cliUi, 'logStart').returnsThis();
    const cliUiErrorStub = this.stub(cliUi, 'error').returnsThis();
    const cliUiSuccessStub = this.stub(cliUi, 'success').returnsThis();
    const cliUiLogEndStub = this.stub(cliUi, 'logEnd').returnsThis();

    return stepsUtils.reposClean((error, result) => {
      expect(error).to.not.exist;
      expect(result).to.be.ok;

      assert.calledOnce(gitFlowStub);
      assert.alwaysCalledWithExactly(gitFlowStub, envConst.PATH_REPOS, match.func);

      assert.calledOnce(getErrorStub);
      assert.alwaysCalledWithExactly(getErrorStub);

      assert.calledOnce(wsRequestStub);
      assert.alwaysCalledWithExactly(wsRequestStub, {}, match.func);

      assert.calledOnce(cliUiStopStub);
      assert.alwaysCalledWithExactly(cliUiStopStub);

      assert.calledOnce(cliUiLogStartStub);
      assert.alwaysCalledWithExactly(cliUiLogStartStub);

      assert.calledOnce(cliUiErrorStub);
      assert.alwaysCalledWithExactly(cliUiErrorStub, expectedError);

      assert.calledOnce(cliUiLogEndStub);
      assert.alwaysCalledWithExactly(cliUiLogEndStub);

      assert.notCalled(cliUiSuccessStub);

      return done();
    });
  }));

});