'use strict';

var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var sinonChaiInOrder = require("sinon-chai-in-order");
var expect = chai.expect;
chai.use(sinonChai);
chai.use(sinonChaiInOrder.default);