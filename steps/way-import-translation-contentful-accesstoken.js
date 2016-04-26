'use strict';

var stepBase = require('./../model/base-step');
var util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

var question = {
  'name': 'way-import-translation-contentful-accesstoken',
  'type': 'input',
  'message': 'Contentful asks for "ACCESS_TOKEN"'
};

/**************************************************************************************************************/

var holder = require('./../model/value-holder');
var contentfulService = require('./../service/contentful');

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

/**************************************************************************************************************/

module.exports = new step(question);
