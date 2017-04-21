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

const proxyquire = require('proxyquire');

describe('Service: CLI UI', function() {

  it('should setup environment', sinon.test(function() {
    const updateBottomBarStub = this.stub();
    const BottomBarStub = this.stub().returns({updateBottomBar: updateBottomBarStub});
    const cliUi = proxyquire('../../../service/cli-ui', {inquirer: {ui: {BottomBar: BottomBarStub}}});

    sinon.assert.calledWithNew(BottomBarStub);
    sinon.assert.calledWithExactly(BottomBarStub);
    sinon.assert.calledOnce(updateBottomBarStub);
    sinon.assert.calledWithExactly(updateBottomBarStub, '');

    expect(cliUi).to.be.an('object');
    expect(cliUi).to.have.property('intervalTimeout', 500);
    expect(cliUi).to.have.property('textBase', '* State: ');
    expect(cliUi).to.have.property('textIncrement', '.');
    expect(cliUi).to.have.property('textLine', ' ');
    expect(cliUi).to.have.property('textState', '');
    expect(cliUi).to.have.property('timeStart', false);
  }));

  describe('UI Progress: print messages', function () {
    const argsFixtures = [
      [],
      ['string', 123],
      [{test: {obj: 'print'}}],
      [[123, 'string', true], [{test: {obj: 'print'}}, false]],
      [{message: 'Unhandled server error'}]
    ];

    it('should log error message 6 times', sinon.test(function() {
      const logStub = this.stub(console, 'log');
      const cliUi = require('../../../service/cli-ui');

      // Act
      cliUi.error();
      argsFixtures.map(args => cliUi.error(...args));

      // Assert
      expect(logStub).inOrder.to.have.been.calledWith(cliUi.CONST_FONT_ERROR + ' (no message) ' + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_ERROR + ' (no message) ' + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_ERROR + ' string,123 ' + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_ERROR + ' [object Object] ' + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_ERROR + ' 123,string,true,[object Object],false '  + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_ERROR + ' [object Object] ' + cliUi.CONST_FONT_WHITE)
    }));

    it('should log warn message 6 times', sinon.test(function() {
      const logStub = this.stub(console, 'log');
      const cliUi = require('../../../service/cli-ui');

      // Act
      cliUi.warning();
      argsFixtures.map(args => cliUi.warning(...args));

      // Assert
      expect(logStub).inOrder.to.have.been.calledWith(cliUi.CONST_FONT_WARN + ' (no message) ' + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_WARN + ' (no message) ' + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_WARN + ' string,123 ' + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_WARN + ' [object Object] ' + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_WARN + ' 123,string,true,[object Object],false '  + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_WARN + ' [object Object] ' + cliUi.CONST_FONT_WHITE)
    }));

    it('should log success message 6 times', sinon.test(function() {
      const logStub = this.stub(console, 'log');
      const cliUi = require('../../../service/cli-ui');

      // Act
      cliUi.success();
      argsFixtures.map(args => cliUi.success(...args));

      // Assert
      expect(logStub).inOrder.to.have.been.calledWith(cliUi.CONST_FONT_GREEN + ' (no message) ' + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_GREEN + ' (no message) ' + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_GREEN + ' string,123 ' + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_GREEN + ' [object Object] ' + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_GREEN + ' 123,string,true,[object Object],false '  + cliUi.CONST_FONT_WHITE)
        .subsequently.calledWith(cliUi.CONST_FONT_GREEN + ' [object Object] ' + cliUi.CONST_FONT_WHITE)
    }));
  });

  describe('UI Progress: logging', function () {
    it('should print on console start text', sinon.test(function() {
      const cliUi = require('../../../service/cli-ui');

      const consoleMock = this.mock(console, 'log');
      const logExpectation = consoleMock.expects('log').once().withExactArgs("\n" + cliUi.CONST_SEPARATOR_LINE);

      // Act
      cliUi.logStart();

      // Assert
      logExpectation.verify();
      consoleMock.verify();
      consoleMock.restore();
    }));

    it('should print on console end text', sinon.test(function() {
      const cliUi = require('../../../service/cli-ui');

      const consoleMock = this.mock(console, 'log');
      const logExpectation = consoleMock.expects('log').once().withExactArgs(cliUi.CONST_SEPARATOR_LINE + cliUi.CONST_SEPARATOR_UI);

      // Act
      cliUi.logEnd();

      // Assert
      logExpectation.verify();
      consoleMock.verify();
      consoleMock.restore();
    }));

    it('should not print anything in console', sinon.test(function() {
      const cliUi = require('../../../service/cli-ui');
      const logStartStub = this.stub(cliUi, 'logStart');
      const logEndStub = this.stub(cliUi, 'logEnd');
      const consoleMock = this.mock(console, 'log');
      const logExpectation = consoleMock.expects('log').never();

      // Act
      cliUi.logPrint([]);

      // Assert
      sinon.assert.calledOnce(logStartStub);
      sinon.assert.calledWithExactly(logStartStub);
      sinon.assert.calledOnce(logEndStub);
      sinon.assert.calledWithExactly(logEndStub);
      logExpectation.verify();
      consoleMock.verify();
      consoleMock.restore();
    }));

    it('should print on console some text', sinon.test(function() {
      const cliUi = require('../../../service/cli-ui');
      const logStartStub = this.stub(cliUi, 'logStart');
      const logEndStub = this.stub(cliUi, 'logEnd');
      const consoleMock = this.mock(console, 'log');
      const logExpectation1 = consoleMock.expects('log').once().withExactArgs('string');
      const logExpectation2 = consoleMock.expects('log').once().withExactArgs(123);

      // Act
      cliUi.logPrint(['string', 123]);

      // Assert
      sinon.assert.calledOnce(logStartStub);
      sinon.assert.calledWithExactly(logStartStub);
      sinon.assert.calledOnce(logEndStub);
      sinon.assert.calledWithExactly(logEndStub);
      logExpectation1.verify();
      logExpectation2.verify();
      consoleMock.verify();
      consoleMock.restore();
    }));
  });

  describe('UI Progress: state', function () {
    it('should reset time', sinon.test(function() {
      // DON'T touch `sinon`, this.useFakeTimers is not a function
      const clock = sinon.useFakeTimers();
      const cliUi = require('../../../service/cli-ui');

      expect(cliUi.timeStart).to.be.equal(false);

      clock.tick(2000);
      cliUi.resetTime();

      expect(cliUi.timeStart).to.be.equal(2000);

      clock.tick(2000);
      cliUi.resetTime();

      expect(cliUi.timeStart).to.be.equal(4000);

      clock.tick(2000);
      cliUi.resetTime(false);

      expect(cliUi.timeStart).to.be.equal(6000);

      clock.tick(2000);
      cliUi.resetTime();

      expect(cliUi.timeStart).to.be.equal(8000);

      clock.restore();
    }));

    it('should set state', sinon.test(function() {
      // DON'T touch `sinon`, this.useFakeTimers is not a function
      const clock = sinon.useFakeTimers();
      const updateBottomBarStub = this.stub();
      const BottomBarStub = this.stub().returns({updateBottomBar: updateBottomBarStub});
      const cliUi = proxyquire('../../../service/cli-ui', {inquirer: {ui: {BottomBar: BottomBarStub}}});

      // Act
      sinon.assert.callCount(updateBottomBarStub, 1);

      cliUi.state();
      clock.tick(500);

      sinon.assert.callCount(updateBottomBarStub, 3);

      clock.tick(500);

      sinon.assert.callCount(updateBottomBarStub, 4);

      cliUi.maxTextLine = 5;
      clock.tick(1500);

      sinon.assert.callCount(updateBottomBarStub, 7);

      expect(updateBottomBarStub).inOrder.to.have.been.calledWith('')
        .subsequently.calledWith('')
        .subsequently.calledWith('* State:  | Time elapsed: a few seconds  .')
        .subsequently.calledWith('* State:  | Time elapsed: a few seconds  ..')
        .subsequently.calledWith('* State:  | Time elapsed: a few seconds  ...')
        .subsequently.calledWith('* State:  | Time elapsed: a few seconds  ....')
        .subsequently.calledWith('* State:  | Time elapsed: a few seconds  .');

      // Assert
      clock.restore();
    }));
  })

});