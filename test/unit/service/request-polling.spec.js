'use strict';

const _ = require('lodash');
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

describe('Service: Request polling', function () {
  let longPolling;

  beforeEach(function() {
    longPolling = _.clone(require('../../../service/request-polling'));
  });

  it('should create long polling process', sinon.test(function () {
    expect(longPolling.responseLimit).to.be.equal(3);
    expect(longPolling.requestInterval).to.be.equal(7000);
    expect(longPolling.response).to.be.deep.equal([]);
    expect(longPolling.responseCounter).to.be.equal(0);
    expect(longPolling.responseLastError).to.be.equal('');
    expect(longPolling.responseLastState).to.be.equal(false);
  }));

  it('should reset all properties to default ones', sinon.test(function () {
    longPolling.responseLimit = 10;
    longPolling.requestInterval = 10;
    longPolling.response = 10;
    longPolling.responseCounter = 10;
    longPolling.responseLastError = 10;
    longPolling.responseLastState = 10;

    longPolling.reset();

    expect(longPolling.responseLimit).to.be.equal(10);
    expect(longPolling.requestInterval).to.be.equal(10);
    expect(longPolling.response).to.be.deep.equal([]);
    expect(longPolling.responseCounter).to.be.equal(0);
    expect(longPolling.responseLastError).to.be.equal('');
    expect(longPolling.responseLastState).to.be.equal(false);
  }));

  it('should set time start', sinon.test(function () {
    this.clock = sinon.useFakeTimers();
    const expectedNumberOfRows = 10;
    const timer = 10510;

    this.clock.tick(timer);

    longPolling.setTimeStart(expectedNumberOfRows);

    expect(longPolling.responseLimit).to.be.equal(3);
    expect(longPolling.requestInterval).to.be.equal(7000);
    expect(longPolling.response).to.be.deep.equal([]);
    expect(longPolling.responseCounter).to.be.equal(0);
    expect(longPolling.responseLastError).to.be.equal('');
    expect(longPolling.responseLastState).to.be.equal(false);
    expect(longPolling.timeStart).to.be.deep.equal(new Date(timer));
    expect(longPolling.numberOfRows).to.be.equal(expectedNumberOfRows);
    this.clock.restore();
  }));

  xdescribe('#checkDataSet', function () {
    it('should return Dataset state when error happen during request to WS', sinon.test(function (done) {
      const expectedMessage = 'Server is not reached';
      const expectedError = new Error(expectedMessage);
      const expectedWsResponse = {};
      const wsRequest = require('../../../service/request-ws');
      const getDatasetStateStub = this.stub(wsRequest, 'getDatasetState').callsArgWithAsync(1, expectedError, expectedWsResponse);

      const expectedSuccess = false;
      const data = {};

      longPolling.requestInterval = 100;

      return longPolling.checkDataSet(data, (result) => {
        assert.calledOnce(getDatasetStateStub);
        assert.calledWithExactly(getDatasetStateStub, data, match.func);

        expect(result).to.be.deep.equal({success: expectedSuccess, message: `Error: ${expectedMessage}`});
        expect(longPolling.responseCounter).to.be.equal(0);

        return done();
      });
    }));

    it('should return Dataset state when import/update process was corrupted', sinon.test(function (done) {
      const expectedError = 'Transaction was corrupted';
      const expectedWsResponse = {
        getError: this.stub().returns(expectedError)
      };
      const wsRequest = require('../../../service/request-ws');
      const getDatasetStateStub = this.stub(wsRequest, 'getDatasetState').callsArgWithAsync(1, null, expectedWsResponse);

      const expectedSuccess = false;
      const data = {};

      return longPolling.checkDataSet(data, (result) => {
        assert.calledOnce(getDatasetStateStub);
        assert.calledWithExactly(getDatasetStateStub, data, match.func);

        expect(result).to.be.deep.equal({success: expectedSuccess, message: expectedError});
        expect(longPolling.responseCounter).to.be.equal(0);

        return done();
      });
    }));

    it('should return Dataset state after 1 response when import/update process was completed', sinon.test(function (done) {
      const expectedResult = {modifiedObjects: 0, transaction: {status: 'Completed'}};
      const expectedWsResponse = {
        getError: this.stub(),
        getData: this.stub().returns(expectedResult)
      };

      const wsRequest = require('../../../service/request-ws');
      const cliUi = require('../../../service/cli-ui');

      this.stub(wsRequest, 'getDatasetState').callsArgWithAsync(1, null, expectedWsResponse);
      this.stub(cliUi, 'state');

      const expectedSuccess = true;
      const data = {};

      return longPolling.checkDataSet(data, (result) => {
        assert.calledOnce(wsRequest.getDatasetState);
        assert.calledWithExactly(wsRequest.getDatasetState, data, match.func);

        assert.calledTwice(cliUi.state);
        assert.calledWithExactly(cliUi.state, 'check state, completed', false);

        expect(result).to.be.deep.equal({success: expectedSuccess, message: 'Operation is completed successfully\nno data'});
        expect(longPolling.responseCounter).to.be.equal(0);
        expect(longPolling.responseLastState).to.be.equal(false);
        expect(longPolling.response).to.be.deep.equal([]);

        return done();
      });
    }));

    it('should return Dataset state after 4 responses when import/update process was completed', sinon.test(function (done) {
      longPolling.response = [{}, {}, {}];

      const expectedResult = {modifiedObjects: 0, transaction: {status: 'Completed'}};
      const expectedWsResponse = {
        getError: this.stub(),
        getData: this.stub().returns(expectedResult)
      };

      const wsRequest = require('../../../service/request-ws');
      const cliUi = require('../../../service/cli-ui');

      this.stub(wsRequest, 'getDatasetState').callsArgWithAsync(1, null, expectedWsResponse);
      this.stub(cliUi, 'state');

      const expectedSuccess = true;
      const data = {};

      return longPolling.checkDataSet(data, (result) => {
        assert.calledOnce(wsRequest.getDatasetState);
        assert.calledWithExactly(wsRequest.getDatasetState, data, match.func);

        assert.calledTwice(cliUi.state);
        assert.calledWithExactly(cliUi.state, 'check state, completed', false);

        expect(result).to.be.deep.equal({success: expectedSuccess, message: 'Operation is completed successfully\nno data'});
        expect(longPolling.responseCounter).to.be.equal(0);
        expect(longPolling.responseLastState).to.be.equal(false);
        expect(longPolling.response).to.be.deep.equal([]);

        return done();
      });
    }));

    it('should return Dataset state and print modified objects after 4 responses when import/update process was completed', sinon.test(function (done) {
      this.clock = sinon.useFakeTimers();

      longPolling.response = [{}, {}, {}];
      longPolling.timeStart = new Date();
      longPolling.numberOfRows = 10000;

      const expectedResult = {
        modifiedObjects: {
          entities: 5,
          concepts: 12,
          datapoints: 100,
          translations: 42
        },
        transaction: {status: 'Completed'}
      };
      const expectedWsResponse = {
        getError: this.stub(),
        getData: this.stub().returns(expectedResult)
      };

      const wsRequest = require('../../../service/request-ws');
      const cliUi = require('../../../service/cli-ui');

      this.stub(wsRequest, 'getDatasetState').callsArgWithAsync(1, null, expectedWsResponse);
      this.stub(cliUi, 'state');

      const expectedSuccess = true;
      const data = {};
      const timer = 7000;

      this.clock.tick(timer);

      return longPolling.checkDataSet(data, (result) => {
        assert.calledOnce(wsRequest.getDatasetState);
        assert.calledWithExactly(wsRequest.getDatasetState, data, match.func);

        assert.calledTwice(cliUi.state);
        assert.calledWithExactly(cliUi.state, 'check state, completed', false);

        expect(result).to.be.deep.equal({
          success: expectedSuccess,
          message: "Operation is completed successfully\nEntities: 5; Concepts: 12; DataPoints: 100; Translations: 42; Total approximate time: 7:20s;"
        });
        expect(longPolling.responseCounter).to.be.equal(0);
        expect(longPolling.responseLastState).to.be.equal(false);
        expect(longPolling.response).to.be.deep.equal([]);

        this.clock.restore();
        return done();
      });
    }));

    it('should return Dataset state after 1 response when import/update process was corrupted', sinon.test(function (done) {
      longPolling.response = [{}, {}, {}];
      longPolling.timeStart = new Date();

      const expectedResult = {modifiedObjects: {}, transaction: {status: 'Failed', lastError: 'Error'}};
      const expectedWsResponse = {
        getError: this.stub(),
        getData: this.stub().returns(expectedResult)
      };

      const wsRequest = require('../../../service/request-ws');
      const cliUi = require('../../../service/cli-ui');

      const getDatasetStateStub = this.stub(wsRequest, 'getDatasetState').callsArgWithAsync(1, null, expectedWsResponse);
      const cliUiStub = this.stub(cliUi, 'state');

      const expectedSuccess = true;
      const data = {};

      return longPolling.checkDataSet(data, (result) => {
        assert.calledOnce(getDatasetStateStub);
        assert.calledWithExactly(getDatasetStateStub, data, match.func);

        assert.calledThrice(cliUiStub);
        assert.calledWithExactly(cliUiStub, match('check state, failed').or(match('check state, should not continue, has errors')), false);

        expect(result).to.be.deep.equal({success: expectedSuccess, message: "Operation is completed successfully\nno data"});
        expect(longPolling.responseCounter).to.be.equal(0);
        expect(longPolling.responseLastState).to.be.equal(false);
        expect(longPolling.responseLastError).to.be.equal('');
        expect(longPolling.response).to.be.deep.equal([]);

        return done();
      });
    }));

    it('should return Dataset state after 1 response without modified data when import/update process in progress', sinon.test(function (done) {
      longPolling.response = [{}, {}, {}];

      const expectedResult = {modifiedObjects: 0, transaction: {status: 'In progress'}};
      const expectedError = new Error('Error');
      const expectedWsResponse = {
        getError: this.stub().onFirstCall().returns().onSecondCall().returns(expectedError),
        getData: this.stub().returns(expectedResult)
      };

      const wsRequest = require('../../../service/request-ws');
      const cliUi = require('../../../service/cli-ui');

      const getDatasetStateStub = this.stub(wsRequest, 'getDatasetState').callsArgOnWithAsync(1, wsRequest, null, expectedWsResponse);
      const cliUiStub = this.stub(cliUi, 'state');

      const expectedFail = false;
      const data = {};

      return longPolling.checkDataSet(data, (result) => {
        assert.calledTwice(getDatasetStateStub);
        assert.calledWithExactly(getDatasetStateStub, data, match.func);

        assert.calledThrice(cliUiStub);
        expect(cliUiStub).inOrder.to.have.been.calledWithExactly('check state, in progress')
          .subsequently.calledWithExactly('check state, in progress')
          .subsequently.calledWithExactly('check state, in progress: no data');

        expect(result).to.be.deep.equal({success: expectedFail, message: expectedError.toString()});
        expect(longPolling.responseCounter).to.be.equal(0);
        expect(longPolling.responseLastState).to.be.equal(false);
        expect(longPolling.responseLastError).to.be.equal('');
        expect(longPolling.response).to.be.deep.equal([]);
        return done();
      });
    }));

    it('should return Dataset state after 1 response with modified data when import/update process in progress', sinon.test(function (done) {
      this.clock = sinon.useFakeTimers();

      longPolling.response = [{}, {}, {}];
      longPolling.numberOfRows = 100000000;
      longPolling.timeStart = new Date();

      const expectedResult1 = {modifiedObjects: {
        entities: 20,
        concepts: 555,
        datapoints: 100000,
        translations: 2
      }, transaction: {status: 'In progress'}};

      const expectedResult2 = {modifiedObjects: {
        entities: 20,
        concepts: 555,
        datapoints: 99999423,
        translations: 2
      }, transaction: {status: 'Completed'}};

      const expectedWsResponse = {
        getError: this.stub().returns(),
        getData: this.stub()
          .onFirstCall().returns(expectedResult1)
          .onSecondCall().returns(expectedResult2)
      };

      const wsRequest = require('../../../service/request-ws');
      const cliUi = require('../../../service/cli-ui');

      const getDatasetStateStub = this.stub(wsRequest, 'getDatasetState').callsArgOnWithAsync(1, wsRequest, null, expectedWsResponse);
      const cliUiStub = this.stub(cliUi, 'state');

      const expectedSuccess = true;
      const data = {};
      const timer = 70000;

      this.clock.tick(timer);

      return longPolling.checkDataSet(data, (result) => {
        assert.calledTwice(getDatasetStateStub);
        assert.calledWithExactly(getDatasetStateStub, data, match.func);

        assert.callCount(cliUiStub, 5);
        expect(cliUiStub).inOrder
          .to.have.been.calledWithExactly('check state, in progress')
          .subsequently.calledWithExactly('check state, in progress')
          .subsequently.calledWithExactly('check state, in progress: Entities: 20; Concepts: 555; DataPoints: 100000; Translations: 2; Total approximate time: 19:19:58s;')
          .subsequently.calledWithExactly('check state, completed', false)
          .subsequently.calledWithExactly('check state, completed', false);

        expect(result).to.be.deep.equal({success: expectedSuccess, message: 'Operation is completed successfully\nEntities: 20; Concepts: 555; DataPoints: 99999423; Translations: 2; Total approximate time: 1:10s;'});
        expect(longPolling.responseCounter).to.be.equal(0);
        expect(longPolling.responseLastState).to.be.equal(false);
        expect(longPolling.responseLastError).to.be.equal('');
        expect(longPolling.response).to.be.deep.equal([]);

        this.clock.restore();

        return done();
      });
    }));

  });

  xdescribe('#checkDataSetRemovingStatus', function () {
    it('should return Dataset state when error happen during request to WS', sinon.test(function (done) {
      const expectedMessage = 'Server is not reached';
      const expectedError = new Error(expectedMessage);
      const expectedWsResponse = {};
      const wsRequest = require('../../../service/request-ws');
      const wsRequestStub = this.stub(wsRequest, 'removableStatus').callsArgWithAsync(1, expectedError, expectedWsResponse);

      const expectedSuccess = false;
      const data = {};

      longPolling.requestInterval = 100;

      return longPolling.checkDataSetRemovingStatus(data, (result) => {
        assert.calledOnce(wsRequestStub);
        assert.calledWithExactly(wsRequestStub, data, match.func);

        expect(result).to.be.deep.equal({success: expectedSuccess, message: `Error: ${expectedMessage}`});
        expect(longPolling.responseCounter).to.be.equal(0);

        return done();
      });
    }));

    it('should return Dataset state when import/update process was corrupted', sinon.test(function (done) {
      const expectedError = 'Transaction was corrupted';
      const expectedWsResponse = {
        getError: this.stub().returns(expectedError),
        isSuccess: this.stub().returns(false),
        getData: this.stub().returns({})
      };
      const wsRequest = require('../../../service/request-ws');
      const wsRequestStub = this.stub(wsRequest, 'removableStatus').callsArgWithAsync(1, null, expectedWsResponse);

      const expectedSuccess = false;
      const data = {};

      return longPolling.checkDataSetRemovingStatus(data, (result) => {
        assert.calledOnce(wsRequestStub);
        assert.calledWithExactly(wsRequestStub, data, match.func);

        expect(result).to.be.deep.equal({success: expectedSuccess, message: expectedError});
        expect(longPolling.responseCounter).to.be.equal(0);

        return done();
      });
    }));

    it('should return Dataset state after 1 response when import/update process was completed', sinon.test(function (done) {
      const expectedResult = {};
      const expectedWsResponse = {
        getError: this.stub(),
        isSuccess: this.stub().returns(true),
        getData: this.stub().returns(expectedResult)
      };

      const wsRequest = require('../../../service/request-ws');
      const cliUi = require('../../../service/cli-ui');

      this.stub(wsRequest, 'removableStatus').callsArgWithAsync(1, null, expectedWsResponse);
      this.stub(cliUi, 'state');

      const expectedFail = false;
      const data = {};

      return longPolling.checkDataSetRemovingStatus(data, (result) => {
        assert.calledOnce(wsRequest.removableStatus);
        assert.calledWithExactly(wsRequest.removableStatus, data, match.func);

        assert.calledOnce(cliUi.state);
        assert.calledWithExactly(cliUi.state, 'check state, failed', false);

        expect(result).to.be.deep.equal({success: expectedFail, message: 'Dataset removal is corrupted. Try to start removal again.'});
        expect(longPolling.responseCounter).to.be.equal(0);
        expect(longPolling.responseLastState).to.be.equal(false);
        expect(longPolling.response).to.be.deep.equal([]);

        return done();
      });
    }));

    it('should return Dataset state after 4 responses when import/update process was completed', sinon.test(function (done) {
      longPolling.response = [{modifiedObjects: {}}, {modifiedObjects: {}}, {modifiedObjects: {}}];

      const expectedResult = {};
      const expectedWsResponse = {
        getError: this.stub(),
        getData: this.stub().returns(expectedResult),
        isSuccess: this.stub().returns(true)
      };

      const wsRequest = require('../../../service/request-ws');
      const cliUi = require('../../../service/cli-ui');

      this.stub(wsRequest, 'removableStatus').callsArgWithAsync(1, null, expectedWsResponse);
      this.stub(cliUi, 'state');

      const expectedFail = false;
      const data = {};

      return longPolling.checkDataSetRemovingStatus(data, (result) => {
        assert.calledOnce(wsRequest.removableStatus);
        assert.calledWithExactly(wsRequest.removableStatus, data, match.func);

        assert.calledOnce(cliUi.state);
        assert.calledWithExactly(cliUi.state, 'check state, failed', false);

        expect(result).to.be.deep.equal({success: expectedFail, message: 'Dataset removal is corrupted. Try to start removal again.'});
        expect(longPolling.responseCounter).to.be.equal(0);
        expect(longPolling.responseLastState).to.be.equal(false);
        expect(longPolling.response).to.be.deep.equal([]);

        return done();
      });
    }));

    it('should return Dataset state and print modified objects after 4 responses when import/update process was completed', sinon.test(function (done) {
      this.clock = sinon.useFakeTimers();

      longPolling.response = [{modifiedObjects: {}}, {modifiedObjects: {}}, {modifiedObjects: {}}];
      longPolling.timeStart = new Date();
      longPolling.numberOfRows = 10000;

      const expectedResult = {
        entities: 5,
        concepts: 12,
        datapoints: 100,
        translations: 42
      };
      const expectedWsResponse = {
        getError: this.stub(),
        getData: this.stub().returns(expectedResult),
        isSuccess: this.stub().returns(true)
      };

      const wsRequest = require('../../../service/request-ws');
      const cliUi = require('../../../service/cli-ui');

      this.stub(wsRequest, 'removableStatus').callsArgWithAsync(1, null, expectedWsResponse);
      this.stub(cliUi, 'state');

      const expectedFail = false;
      const data = {};
      const timer = 7000;

      this.clock.tick(timer);

      return longPolling.checkDataSetRemovingStatus(data, (result) => {
        assert.calledThrice(wsRequest.removableStatus);
        assert.calledWithExactly(wsRequest.removableStatus, data, match.func);

        assert.callCount(cliUi.state, 6);
        expect(cliUi.state).inOrder
          .to.have.been.calledWithExactly('check state, in progress')
          .subsequently.calledWithExactly('removal progress: Concepts: 12; Entities: 5; DataPoints: 100; ')
          .subsequently.calledWithExactly('check state, in progress')
          .subsequently.calledWithExactly('removal progress: Concepts: 12; Entities: 5; DataPoints: 100; ')
          .subsequently.calledWithExactly('check state, failed', false)
          .subsequently.calledWithExactly('removal progress: Concepts: 12; Entities: 5; DataPoints: 100; ');

        expect(result).to.be.deep.equal({
          success: expectedFail,
          message: "Dataset removal is corrupted. Try to start removal again."
        });
        expect(longPolling.responseCounter).to.be.equal(0);
        expect(longPolling.responseLastState).to.be.equal(false);
        expect(longPolling.response).to.be.deep.equal([]);

        this.clock.restore();
        return done();
      });
    }));

  });

  xit('should', sinon.test(function () {
    const longPolling = require('../../../service/request-polling');

    const expectedNumDocuments = 10;
    const expectedType = 'Concepts';

    const removedDocs = longPolling.toStringRemovedDocs(expectedNumDocuments, expectedType);

    expect(removedDocs).to.be.equal(`${expectedType}: ${expectedNumDocuments}; `);
  }));

  xit('should', sinon.test(function () {
    const longPolling = require('../../../service/request-polling');

    const expectedNumDocuments = 0;
    const expectedType = 'Concepts';

    const removedDocs = longPolling.toStringRemovedDocs(expectedNumDocuments, expectedType);

    expect(removedDocs).to.be.equal('');
  }));
});