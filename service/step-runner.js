'use strict';

const SchemeConst = require('../model/step-const');
const StepList = require('../steps/');
const inquirer = require('inquirer');

function StepFlow(schemeConfig, holder) {

  let self = this;

  // public
  self.run = run;
  self.fillChoice = fillChoice;
  self.setNextDynamic = setNextDynamic;
  self.setNextStrategyDynamic = setNextStrategyDynamic;

  // setup
  self.scheme = schemeConfig;
  self.holder = holder;

  self.stepFirst = false;
  process();

  return this;

  /* methods definition */

  function run () {
    if(!!StepList[self.stepFirst]) {
      StepList[self.stepFirst].run(this.holder, this);
    }
  }

  function process () {
    if(!!self.scheme) {
      for(let itemKey in self.scheme) {
        processStepStart(itemKey);
        processRelation(itemKey);
      }
    }
  }

  function processStepStart(stepKey) {
    let step = self.scheme[stepKey];
    if(!!step.start) {
      self.stepFirst = stepKey;
    }
  }

  function processRelation(stepKey) {

    let step = self.scheme[stepKey];

    // Next Directly
    if(step.type == SchemeConst.STEP_STATIC_SINGLE || !!step.nextDynamic) {

      let nextDynamic = !!step.nextDynamic ? step.nextDynamic : step.next;

      let nextStep = StepList[nextDynamic];
      StepList[stepKey].setNext(nextStep);

    }
    // Next Strategy
    else if (step.type == SchemeConst.STEP_STATIC_MULTI) {

      let nextStepStrategy = {};

      for(let nextKey in step.next) {
        let nextStepKey = step.next[nextKey];
        let nextStep = StepList[nextStepKey];
        nextStepStrategy[nextKey] = nextStep;
      }

      StepList[stepKey].setNextStrategy(nextStepStrategy);
      fillChoice(stepKey);
    }
    // Next Dynamically defined in pre-hook
    else if (step.type == SchemeConst.STEP_DYNAMIC && !!step.nextStrategyDynamic) {

      let nextStepStrategy = {};

      for(let nextKey in step.nextStrategyDynamic) {
        let nextStepKey = step.nextStrategyDynamic[nextKey];
        let nextStep = StepList[nextStepKey];
        nextStepStrategy[nextKey] = nextStep;
      }

      StepList[stepKey].setNextStrategy(nextStepStrategy);
      fillChoice(stepKey);
    }
  }

  function setNextStrategyDynamic (stepKey, nextStrategyDynamic) {
    self.scheme[stepKey]['nextStrategyDynamic'] = nextStrategyDynamic;
    processRelation(stepKey);
  }

  function setNextDynamic (stepKey, nextDynamic) {
    self.scheme[stepKey]['nextDynamic'] = nextDynamic;
    processRelation(stepKey);
  }  

  function fillChoice (stepKey) {

    let step = self.scheme[stepKey];
    let nextStepStrategy = StepList[stepKey].nextStrategy;

    if(typeof step.separator != 'undefined' && step.separator === true || typeof step.separator == 'undefined') {

      let separator = new inquirer.Separator();
      StepList[stepKey].step.choices.push(separator);
    }

    if(typeof step.back != 'undefined' && !!step.back) {

      let backStep = StepList[step.back];
      nextStepStrategy[SchemeConst.STEP_KEY_BACK] = backStep;

      StepList[stepKey].step.choices.push({
        name: 'Back',
        value: SchemeConst.STEP_KEY_BACK
      });
    }

    if(typeof step.exit != 'undefined' && step.exit === true) {

      nextStepStrategy[SchemeConst.STEP_KEY_EXIT] = false;

      StepList[stepKey].step.choices.push({
        name: 'Exit',
        value: SchemeConst.STEP_KEY_EXIT
      });
    }
  }
};

module.exports = function (schemeConfig, holder) {
  return new StepFlow(schemeConfig, holder);
}