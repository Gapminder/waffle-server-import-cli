"use strict";
var inquirer = require("inquirer");
var Rx = require('rx');

console.log("Hi, welcome to Node Pizza");

var questions = [
  {
    type: "confirm",
    name: "toBeDelivered",
    message: "Is it for a delivery",
    default: false
  },
  {
    type: "list",
    name: "size",
    message: "What size do you need",
    choices: [ "Large", "Medium", "Small" ],
    filter: function( val ) { return val.toLowerCase(); }
  }
];

var prompts = Rx.Observable.create(function( obs ) {
  obs.onNext(questions[0]);
  setTimeout(function () {
    obs.onNext(questions[1]);
    obs.onCompleted();
  });
});

inquirer.prompt(prompts);
