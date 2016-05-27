'use strict';

const stepBase = require('./../../model/base-step');
const util = require('util');
const cliProgress = require('./../../service/ui-progress');
const inquirer = require('inquirer');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

// Question Definition

let question = {
  'name': 'way-import-translation-contentful-accesstoken',
  'type': 'input',
  'default': 'xxx',
  'message': 'Contentful asks for "ACCESS_TOKEN"'
};

// Own Process Implementation

const holder = require('./../../model/value-holder');
const contentfulService = require('./../../service/contentful');

step.prototype.process = function (inputValue) {
  var done = this.async();

  var accessSpace = holder.get('way-import-translation-contentful-spaceid');
  var accessToken = inputValue;

  contentfulService
    .init(accessSpace, accessToken)
    .get('book')
    .then(function (contentType) {
      console.log("success");
      console.log(util.inspect(contentType, {depth: null}));
      done(null, true);
    }, function(error) {
      done(null, error.message);
    });
};

// Export Module

module.exports = new step(question);
