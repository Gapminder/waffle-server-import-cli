'use strict';

const sinon = require('sinon');
const assert = sinon.assert;
const match = sinon.match;
const sinonTest = require("sinon-test");
sinon.test = sinonTest.configureTest(sinon);
sinon.testCase = sinonTest.configureTestCase(sinon);

const chai = require('chai');
const expect = chai.expect;

const sinonChai = require('sinon-chai');
const sinonChaiInOrder = require('sinon-chai-in-order');
chai.use(sinonChai);
chai.use(sinonChaiInOrder.default);

const SchemeConst = require('../../../model/step-const');

describe('Service: Step runner', function () {
  it('should create step runner instance with no config', sinon.test(function () {
    const StepRunner = require('../../../service/step-runner');
    const expectedScheme = null;
    const expectedHolder = sinon.spy();
    const StepFlow = new StepRunner(expectedScheme, expectedHolder);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.false;
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);
    assert.notCalled(expectedHolder);
  }));

  it('should create step runner instance with empty config', sinon.test(function () {
    const StepRunner = require('../../../service/step-runner');
    const expectedScheme = {};
    const expectedHolder = sinon.spy();
    const StepFlow = new StepRunner(expectedScheme, expectedHolder);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.false;
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);
    assert.notCalled(expectedHolder);
  }));

  it('should create step runner instance with config with one step (not first)', sinon.test(function () {
    const StepRunner = require('../../../service/step-runner');
    const expectedScheme = {
      'step-number-one': {
        start: false
      }
    };
    const expectedHolder = sinon.spy();
    const StepFlow = new StepRunner(expectedScheme, expectedHolder);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.false;
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);
    assert.notCalled(StepFlow.holder);
  }));

  it('should create step runner instance with config with one step (first)', sinon.test(function () {
    const StepRunner = require('../../../service/step-runner');
    const expectedScheme = {
      'step-number-one': {
        start: true
      }
    };
    const expectedHolder = sinon.spy();
    const StepFlow = new StepRunner(expectedScheme, expectedHolder);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.equal('step-number-one');
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);
    assert.notCalled(StepFlow.holder);
  }));

  it('should run process relation when step.type is static-single', sinon.test(function () {
    const StepList = this.stub(require('../../../steps'));

    StepList['step-number-one'] = {
      setNext: this.spy()
    };
    StepList.nextStepNumberTwo = {
      setNext: this.spy()
    };

    const StepRunner = require('../../../service/step-runner');
    const expectedScheme = {
      'step-number-one': {
        start: false,
        next: 'nextStepNumberTwo',
        type: SchemeConst.STEP_STATIC_SINGLE,
      }
    };
    const expectedHolder = sinon.spy();
    const StepFlow = new StepRunner(expectedScheme, expectedHolder);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.false;
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);
    assert.notCalled(StepFlow.holder);
    assert.calledOnce(StepList['step-number-one'].setNext);
    assert.calledWithExactly(StepList['step-number-one'].setNext, StepList.nextStepNumberTwo);
    assert.notCalled(StepList.nextStepNumberTwo.setNext);
  }));

  it('should run process relation when step.type is not static-single but next step is dynamic', sinon.test(function () {
    const StepList = this.stub(require('../../../steps'));

    StepList['step-number-one'] = {
      setNext: this.spy(),
    };
    StepList.nextStepNumberTwo = {
      setNext: this.spy()
    };

    const StepRunner = require('../../../service/step-runner');
    const expectedScheme = {
      'step-number-one': {
        start: false,
        type: 123,
        nextDynamic: 'nextStepNumberTwo'
      }
    };
    const expectedHolder = sinon.spy();
    const StepFlow = new StepRunner(expectedScheme, expectedHolder);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.false;
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);
    assert.notCalled(StepFlow.holder);
    assert.calledOnce(StepList['step-number-one'].setNext);
    assert.calledWithExactly(StepList['step-number-one'].setNext, StepList.nextStepNumberTwo);
    assert.notCalled(StepList.nextStepNumberTwo.setNext);

  }));

  it('should run process relation when step.type is static-multi', sinon.test(function () {
    const StepList = this.stub(require('../../../steps'));
    const inquirer = require('inquirer');

    StepList['step-number-one'] = {
      setNextStrategy: this.spy(),
      step: {
        choices: []
      }
    };
    StepList['next-step-number-two'] = {
      setNext: this.spy()
    };

    const StepRunner = require('../../../service/step-runner');
    const expectedScheme = {
      'step-number-one': {
        start: false,
        type: SchemeConst.STEP_STATIC_MULTI,
        next: {
          'next-step-number-two': 'next-step-number-two'
        }
      }
    };
    const expectedHolder = sinon.spy();
    const StepFlow = new StepRunner(expectedScheme, expectedHolder);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.false;
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);

    assert.notCalled(StepFlow.holder);
    assert.notCalled(StepList['next-step-number-two'].setNext);

    assert.calledOnce(StepList['step-number-one'].setNextStrategy);
    assert.calledWithExactly(StepList['step-number-one'].setNextStrategy, {'next-step-number-two': StepList['next-step-number-two']});

    expect(StepList['step-number-one'].step.choices).to.have.lengthOf(1);
    expect(StepList['step-number-one'].step.choices[0]).instanceof(inquirer.Separator);
    expect(StepList['step-number-one'].step.choices[0].line).to.contain('──────────────');
    expect(StepList['step-number-one'].step.choices[0]).to.have.deep.property('type', 'separator');
  }));

  it('should run process relation when step.type is dynamic', sinon.test(function () {
    const StepList = this.stub(require('../../../steps'));
    const inquirer = require('inquirer');

    StepList['step-number-one'] = {
      setNextStrategy: this.spy(),
      step: {
        choices: []
      }
    };
    StepList['next-step-number-two'] = {
      setNext: this.spy()
    };

    const StepRunner = require('../../../service/step-runner');
    const githubUrl = 'git@github.com:open-numbers/ddf--gapminder--systema_globalis.git';
    const expectedScheme = {
      'step-number-one': {
        start: false,
        type: SchemeConst.STEP_DYNAMIC,
        nextStrategyDynamic: {
          [githubUrl]: 'next-step-number-two'
        }
      }
    };

    const expectedHolder = sinon.spy();
    const StepFlow = new StepRunner(expectedScheme, expectedHolder);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.false;
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);

    assert.notCalled(StepFlow.holder);
    assert.notCalled(StepList['next-step-number-two'].setNext);

    assert.calledOnce(StepList['step-number-one'].setNextStrategy);
    assert.calledWithExactly(StepList['step-number-one'].setNextStrategy, {[githubUrl]: StepList['next-step-number-two']});

  }));

  it('should run process relation when step.type is dynamic and separator is true', sinon.test(function () {
    const StepList = this.stub(require('../../../steps'));
    const inquirer = require('inquirer');

    StepList['step-number-one'] = {
      setNextStrategy: this.spy(),
      step: {
        choices: []
      }
    };
    StepList['next-step-number-two'] = {
      setNext: this.spy()
   };

    const StepRunner = require('../../../service/step-runner');
    const githubUrl = 'git@github.com:open-numbers/ddf--gapminder--systema_globalis.git';
    const expectedScheme = {
      'step-number-one': {
        start: false,
        type: SchemeConst.STEP_DYNAMIC,
        separator: true,
        nextStrategyDynamic: {
          [githubUrl]: 'next-step-number-two'
        }
      }
    };

    const expectedHolder = sinon.spy();
    const StepFlow = new StepRunner(expectedScheme, expectedHolder);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.false;
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);

    assert.notCalled(StepFlow.holder);
    assert.notCalled(StepList['next-step-number-two'].setNext);

    assert.calledOnce(StepList['step-number-one'].setNextStrategy);
    assert.calledWithExactly(StepList['step-number-one'].setNextStrategy, {[githubUrl]: StepList['next-step-number-two']});

    expect(StepList['step-number-one'].step.choices).to.have.lengthOf(1);
    expect(StepList['step-number-one'].step.choices[0]).instanceof(inquirer.Separator);
    expect(StepList['step-number-one'].step.choices[0].line).to.contain('──────────────');
    expect(StepList['step-number-one'].step.choices[0]).to.have.deep.property('type', 'separator');
  }));

  it('should run process relation when step.type is dynamic and separator is false and back is true', sinon.test(function () {
    const StepList = this.stub(require('../../../steps'));
    const inquirer = require('inquirer');

    StepList['step-number-one'] = {
      setNextStrategy: this.spy(),
      nextStrategy: {},
      step: {
        choices: []
      }
    };
    StepList['next-step-number-two'] = {
      setNext: this.spy()
    };

    const StepRunner = require('../../../service/step-runner');
    const githubUrl = 'git@github.com:open-numbers/ddf--gapminder--systema_globalis.git';
    const expectedScheme = {
      'step-number-one': {
        start: false,
        type: SchemeConst.STEP_DYNAMIC,
        separator: false,
        back: true,
        nextStrategyDynamic: {
          [githubUrl]: 'next-step-number-two'
        }
      }
    };

    const expectedHolder = sinon.spy();
    const StepFlow = new StepRunner(expectedScheme, expectedHolder);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.false;
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);

    assert.notCalled(StepFlow.holder);
    assert.notCalled(StepList['next-step-number-two'].setNext);

    assert.calledOnce(StepList['step-number-one'].setNextStrategy);
    assert.calledWithExactly(StepList['step-number-one'].setNextStrategy, {[githubUrl]: StepList['next-step-number-two']});

    expect(StepList['step-number-one'].step.choices).to.be.deep.equal([  {
      "name": "Back",
      "value": "step::key::back"
    }]);
  }));

  it('should run process relation when step.type is dynamic and separator is false and back is false and exit is true', sinon.test(function () {
    const StepList = this.stub(require('../../../steps'));
    const inquirer = require('inquirer');

    StepList['step-number-one'] = {
      setNextStrategy: this.spy(),
      nextStrategy: {},
      step: {
        choices: []
      }
    };
    StepList['next-step-number-two'] = {
      setNext: this.spy()
    };

    const StepRunner = require('../../../service/step-runner');
    const githubUrl = 'git@github.com:open-numbers/ddf--gapminder--systema_globalis.git';
    const expectedScheme = {
      'step-number-one': {
        start: false,
        type: SchemeConst.STEP_DYNAMIC,
        separator: false,
        back: false,
        exit: true,
        nextStrategyDynamic: {
          [githubUrl]: 'next-step-number-two'
        }
      }
    };

    const expectedHolder = sinon.spy();
    const StepFlow = new StepRunner(expectedScheme, expectedHolder);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.false;
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);

    assert.notCalled(StepFlow.holder);
    assert.notCalled(StepList['next-step-number-two'].setNext);

    assert.calledOnce(StepList['step-number-one'].setNextStrategy);
    assert.calledWithExactly(StepList['step-number-one'].setNextStrategy, {[githubUrl]: StepList['next-step-number-two']});

    expect(StepList['step-number-one'].step.choices).to.be.deep.equal([{
      "name": "Exit",
      "value": "step::key::exit"
    }]);
  }));

  it('should create step runner instance with no config and run step which doesn\'t exist in StepList' , sinon.test(function () {
    const StepRunner = require('../../../service/step-runner');
    const expectedScheme = null;
    const expectedHolder = sinon.spy();

    const StepFlow = new StepRunner(expectedScheme, expectedHolder);
    StepFlow.run();

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.false;
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);
    assert.notCalled(expectedHolder);
  }));

  it('should create step runner instance with no config and run step which exists in StepList' , sinon.test(function () {
    const StepRunner = require('../../../service/step-runner');
    const StepList = this.stub(require('../../../steps'));

    StepList['step-number-one'] = {
      run: this.spy()
    };
    const expectedScheme = {
      'step-number-one': {
        start: true
      }
    };
    const expectedHolder = sinon.spy();

    const StepFlow = new StepRunner(expectedScheme, expectedHolder);
    StepFlow.run();

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.equal('step-number-one');
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);

    assert.notCalled(StepFlow.holder);
    assert.calledOnce(StepList['step-number-one'].run);
    assert.calledWithExactly(StepList['step-number-one'].run, StepFlow.holder, StepFlow);
  }));

  it('should create step runner instance with default config and run setNextDynamic function' , sinon.test(function () {
    const StepRunner = require('../../../service/step-runner');
    const StepList = this.stub(require('../../../steps'));

    StepList['step-number-one'] = {
      run: this.spy(),
      setNext: this.spy()
    };
    StepList['next-step-number-two'] = {
      setNext: this.spy()
    };

    const expectedScheme = {
      'step-number-one': {
        start: true
      }
    };
    const expectedHolder = sinon.spy();
    const nextDynamic = 'next-step-number-two';

    const StepFlow = new StepRunner(expectedScheme, expectedHolder);
    StepFlow.setNextDynamic('step-number-one', nextDynamic);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.equal('step-number-one');
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);

    assert.notCalled(StepFlow.holder);
    assert.calledOnce(StepList['step-number-one'].setNext);
    assert.calledWithExactly(StepList['step-number-one'].setNext, StepList['next-step-number-two']);
    assert.notCalled(StepList['next-step-number-two'].setNext);

  }));

  it('should create step runner instance with default config and run setNextStrategyDynamic function' , sinon.test(function () {
    const StepRunner = require('../../../service/step-runner');
    const StepList = this.stub(require('../../../steps'));

    StepList['step-number-one'] = {
      setNextStrategy: this.spy(),
      step: {
        choices: []
      }
    };
    StepList['next-step-number-two'] = {
      setNextStrategy: this.spy()
    };
    const expectedScheme = {
      'step-number-one': {
        start: true,
        type: SchemeConst.STEP_DYNAMIC
      }
    };
    const expectedHolder = sinon.spy();

    const githubUrl = 'git@github.com:open-numbers/ddf--gapminder--systema_globalis.git';
    const nextStrategyDynamic = {
      [githubUrl]: 'next-step-number-two'
    };

    const StepFlow = new StepRunner(expectedScheme, expectedHolder);
    StepFlow.setNextStrategyDynamic('step-number-one', nextStrategyDynamic);

    expect(StepFlow);
    expect(StepFlow.stepFirst).to.be.equal('step-number-one');
    expect(StepFlow.holder).to.be.equal(expectedHolder);
    expect(StepFlow.scheme).to.be.equal(expectedScheme);

    assert.notCalled(StepFlow.holder);
    assert.calledOnce(StepList['step-number-one'].setNextStrategy);
    assert.calledWithExactly(StepList['step-number-one'].setNextStrategy, {[githubUrl]: StepList['next-step-number-two']});
    assert.notCalled(StepList['next-step-number-two'].setNextStrategy);

  }));

});