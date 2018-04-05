'use strict';

const sinon = require('sinon');
const sinonTest = require("sinon-test");
sinon.test = sinonTest.configureTest(sinon);
sinon.testCase = sinonTest.configureTestCase(sinon);

const chai = require('chai');
const expect = chai.expect;

const testFile = 'model/base-step.js';
const testItem = require(`./../../../${testFile}`);
const inquirer = require('inquirer');

describe(`Unit Test: ${testFile}`, function () {

  const initData = {
    name: 'some-step'
  };

  describe("API: getName", function () {

    it("should return correct result", function (done) {

      const resultFixture = 'some-step';

      const testItemInstance = new testItem(initData);
      const result = testItemInstance.getName();

      expect(result).to.be.equal(resultFixture);

      done();
    });

  });

  describe("API: process", function () {

    it("should return correct result", function (done) {

      const resultFixture = true;

      const testItemInstance = new testItem(initData);
      const result = testItemInstance.process();

      expect(result).to.be.equal(resultFixture);

      done();
    });

  });

  describe("API: filter", function () {

    it("should return correct result", function (done) {

      const inputData = 'test';
      const resultFixture = 'test';

      const testItemInstance = new testItem(initData);
      const result = testItemInstance.filter(inputData);

      expect(result).to.be.equal(resultFixture);

      done();
    });

  });

  describe("API: availableChoice", function () {

    it("should return correct result for specific input value - back", function (done) {

      const inputData = 'step::key::back';
      const resultFixture = false;

      const testItemInstance = new testItem(initData);
      const result = testItemInstance.availableChoice(inputData);

      expect(result).to.be.equal(resultFixture);

      done();
    });

    it("should return correct result for specific input value - exit", function (done) {

      const inputData = 'step::key::exit';
      const resultFixture = false;

      const testItemInstance = new testItem(initData);
      const result = testItemInstance.availableChoice(inputData);

      expect(result).to.be.equal(resultFixture);

      done();
    });

    it("should return correct result for non-specific input values", function (done) {

      const inputData = 'step::any-key';
      const resultFixture = true;

      const testItemInstance = new testItem(initData);
      const result = testItemInstance.availableChoice(inputData);

      expect(result).to.be.equal(resultFixture);

      done();
    });

  });

  describe("API: preProcess", function () {

    it("should be executed with correct flow", function (done) {

      const inputData = sinon.stub();

      const testItemInstance = new testItem(initData);
      testItemInstance.preProcess(inputData);

      expect(inputData.calledOnce).to.equal(true);

      done();
    });

  });

  describe("API: setBack", function () {

    it("should change private property", function (done) {

      const inputData = 'test';
      const resultFixtureInitial = false;
      const resultFixtureProcessed = 'test';

      const testItemInstance = new testItem(initData);
      expect(testItemInstance.backDirect).to.equal(resultFixtureInitial);

      testItemInstance.setBack(inputData);
      expect(testItemInstance.backDirect).to.equal(resultFixtureProcessed);

      done();
    });

  });

  describe("API: setQuestionChoices", function () {

    it("should be executed with correct flow", function (done) {

      const list = ['list-some-value'];
      const nextStrategy = ['next-some-value'];

      const testItemInstance = new testItem(initData);
      testItemInstance.runner = {setNextStrategyDynamic: sinon.stub()};

      expect(testItemInstance.step.choices).to.be.undefined;

      testItemInstance.setQuestionChoices(list, nextStrategy);

      expect(testItemInstance.step.choices).to.not.be.undefined;
      expect(testItemInstance.runner.setNextStrategyDynamic.calledOnce).to.equal(true);
      expect(testItemInstance.runner.setNextStrategyDynamic.getCall(0).args[0]).to.equal('some-step');
      expect(testItemInstance.runner.setNextStrategyDynamic.getCall(0).args[1]).to.deep.equal(nextStrategy);

      done();
    });

  });

  describe("API: setNextDynamic", function () {

    it("should be executed with correct flow", function (done) {

      const inputData = 'test';

      const testItemInstance = new testItem(initData);
      testItemInstance.runner = {setNextDynamic: sinon.stub()};

      testItemInstance.setNextDynamic(inputData);

      expect(testItemInstance.runner.setNextDynamic.calledOnce).to.equal(true);
      expect(testItemInstance.runner.setNextDynamic.getCall(0).args[0]).to.equal('some-step');
      expect(testItemInstance.runner.setNextDynamic.getCall(0).args[1]).to.deep.equal('test');

      done();
    });

  });

  describe("API: setNext", function () {

    it("should be executed with correct flow", function (done) {

      const inputData = 'test';

      const testItemInstance = new testItem(initData);

      expect(testItemInstance.nextDirect).to.be.false;
      expect(testItemInstance.nextStrategy).to.be.false;

      testItemInstance.setNext(inputData);

      expect(testItemInstance.nextDirect).to.equal('test');
      expect(testItemInstance.nextStrategy).to.be.false;

      done();
    });

  });

  describe("API: setNextStrategy", function () {

    it("should be executed with correct flow", function (done) {

      const inputData = 'test';

      const testItemInstance = new testItem(initData);

      expect(testItemInstance.nextDirect).to.be.false;
      expect(testItemInstance.nextStrategy).to.be.false;

      testItemInstance.setNextStrategy(inputData);

      expect(testItemInstance.nextDirect).to.be.false;
      expect(testItemInstance.nextStrategy).to.equal('test');

      done();
    });

  });

  describe("API: run", function () {

    it("should be executed with correct flow, handling error", function (done) {

      const holder = {};
      const runner = {};
      sinon.stub(inquirer, "prompt");

      const testItemInstance = new testItem(initData);
      sinon.stub(testItemInstance, "preProcess").callsFake(function(callback) {
        callback('error');
      });

      testItemInstance.run(holder, runner);

      // break chain, Promise resolving
      setTimeout(function() {

        expect(inquirer.prompt.called).to.equal(false);

        inquirer.prompt.restore();
        done();
      }, 25);
    });

    it("should be executed with correct flow, without additional methods", function (done) {
      const holder = {set: sinon.stub()};
      const runner = {};

      sinon.stub(inquirer, "prompt").callsFake(function(step) {
        return new Promise(function(resolve, reject) {
          resolve({'some-step': 'some-value'});
        });
      });

      const testItemInstance = new testItem(initData);

      testItemInstance.run(holder, runner);

      // break chain, Promise resolving
      setTimeout(function() {

        expect(inquirer.prompt.calledOnce).to.equal(true);

        inquirer.prompt.restore();
        done();
      }, 25);

    });

    it("should be executed with correct flow, with additional method backDirect", function (done) {
      const holder = {set: sinon.stub()};
      const runner = {};

      sinon.stub(inquirer, "prompt").callsFake(function(step) {
        return new Promise(function(resolve, reject) {
          resolve({'some-step': 'Back'});
        });
      });

      const testItemInstance = new testItem(initData);
      testItemInstance.backDirect = {run: sinon.stub()};

      testItemInstance.run(holder, runner);

      // break chain, Promise resolving
      setTimeout(function() {

        expect(inquirer.prompt.calledOnce).to.equal(true);
        expect(testItemInstance.backDirect.run.calledOnce).to.equal(true);

        inquirer.prompt.restore();
        done();
      }, 25);

    });

    it("should be executed with correct flow, with additional method nextDirect", function (done) {
      const holder = {set: sinon.stub()};
      const runner = {};

      sinon.stub(inquirer, "prompt").callsFake(function(step) {
        return new Promise(function(resolve, reject) {
          resolve({'some-step': 'any'});
        });
      });

      const testItemInstance = new testItem(initData);
      testItemInstance.nextDirect = {run: sinon.stub()};

      testItemInstance.run(holder, runner);

      // break chain, Promise resolving
      setTimeout(function() {

        expect(inquirer.prompt.calledOnce).to.equal(true);
        expect(testItemInstance.nextDirect.run.calledOnce).to.equal(true);

        inquirer.prompt.restore();
        done();
      }, 25);

    });

    it("should be executed with correct flow, with additional method nextStrategy", function (done) {
      const holder = {set: sinon.stub()};
      const runner = {};

      sinon.stub(inquirer, "prompt").callsFake(function(step) {
        return new Promise(function(resolve, reject) {
          resolve({'some-step': 'strategy-key'});
        });
      });

      const testItemInstance = new testItem(initData);
      testItemInstance.nextStrategy = {'strategy-key': {run: sinon.stub()}};

      testItemInstance.run(holder, runner);

      // break chain, Promise resolving
      setTimeout(function() {

        expect(inquirer.prompt.calledOnce).to.equal(true);
        expect(testItemInstance.nextStrategy['strategy-key'].run.calledOnce).to.equal(true);

        inquirer.prompt.restore();
        done();
      }, 25);

    });

  });

});