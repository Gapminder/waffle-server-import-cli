'use strict';

var contentful = require('contentful');
var util = require('util');

var service = function () {
  return this;
};

service.prototype.client = null;

service.prototype.init = function (space, accessToken) {
  this.client = contentful.createClient({
    space: space,
    accessToken: accessToken
  });
  return this;
};

// return promise
service.prototype.get = function (item) {
  return this.client.getContentType(item);
};

module.exports = new service();
