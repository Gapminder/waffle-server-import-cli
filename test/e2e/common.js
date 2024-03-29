'use strict';

const async = require('async');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

const fixtures = require('./fixtures');
const cliPath = path.resolve(__dirname, '../../');

module.exports = {
  getExpectedErrorSteps,
  setupResponseHandler,
  checkExpectedSteps,
  prettifyStdout,
  readFile,
  clearFileFromTestedData,
  cliPath
};

function getExpectedErrorSteps(errorMatcher) {
  return [
    {
      error: true,
      messageRegex: errorMatcher
    }
  ];
}

function setupResponseHandler(responseHandler, responseFixture = [], status = 200) {
  responseHandler.callsFake(async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    console.log(`\t\t\x1b[36mRequested url: \x1b[0m${req.method}\t\x1b[34;4;2m${req.path}\x1b[37m\t${JSON.stringify(req.query)}\t${JSON.stringify(req.body)}\t${JSON.stringify(req.params)}\x1b[0m`);

    await res
      .status(status)
      .send(JSON.stringify(responseFixture));

    return next();
  });
}

function checkExpectedSteps(expectedSteps, prettifiedSteps) {
  const actualStepsCount = prettifiedSteps.length - 1;
  const expectedStepsCount = expectedSteps.length - 1;
  const expectedMessages = _.chain(expectedSteps).flatMap('messageRegex').compact().value();
  expect(expectedMessages).to.not.empty;

  _.forEach(expectedSteps, (expectedStep, index) => {
    const actualStep = prettifiedSteps[index];
    const expectedMessageRegex = expectedStep.messageRegex;

    if (_.isEmpty(actualStep)) {
      console.log(`\x1b[31m✘ Actual step [${index}/${expectedStepsCount}]: \x1b[33m${expectedMessageRegex}\x1b[0m`);
      console.log(`\x1b[37m\t\t\t(no data)\x1b[0m`);

      assert(actualStep, `expected actual ${index} step of ${expectedStepsCount} to match ${expectedMessageRegex}, but it is empty`);
    }

    if (!_.isNil(expectedMessageRegex)) {
      const isErrorStep = !!expectedStep.error;
      const isListStep = !!expectedStep.list;

      if (isErrorStep || isListStep) {
        const actualMessage = actualStep.join('\n');

        if (!actualMessage.match(expectedMessageRegex)) {
          console.log(`\t\t\x1b[31m✘ Actual step [${index}/${expectedStepsCount}]: \x1b[33m${expectedMessageRegex}\x1b[0m`);
          console.log(`\x1b[37m\t\t\t${actualStep.join('\n\t\t\t')}\x1b[0m`);

          assert(actualMessage.match(expectedMessageRegex), `expected \'${actualMessage}\' to match ${expectedMessageRegex} on step ${index} of ${actualStepsCount}`);
        }
      } else {
        _.forEach(actualStep, (actualMessage, messageIndex) => {
          if (!expectedStep.sameType && messageIndex) {
            return;
          }

          if (!actualMessage.match(expectedMessageRegex)) {
            console.log(`\t\t\x1b[31m✘ Actual step [${index}/${expectedStepsCount}]: \x1b[33m${expectedMessageRegex}\x1b[0m`);
            console.log(`\x1b[37m\t\t\t${actualStep.join('\n\t\t\t')}\x1b[0m`);

            assert(actualMessage.match(expectedMessageRegex), `expected \'${actualMessage}\' to match ${expectedMessageRegex} on step ${index} of ${actualStepsCount}`);
          }
        });
      }
    }

    console.log(`\t\t\x1b[32m✓\x1b[0m Actual step \x1b[32m[${index}/${expectedStepsCount}]: \x1b[33m${expectedMessageRegex}\x1b[0m`);
    console.log(`\x1b[37m\t\t\t${actualStep.join('\n\t\t\t')}\x1b[0m`);
  });
}

function prettifyStdout(stdoutData) {
  const prettifiedData = _.reduce(stdoutData, (result, step) => {
    const prettifiedStep = step.toString('utf-8')
      .replace(/\u001b\[1000D/gm, '')
      .replace(/\u001b\[K/gm, '')
      .replace(/\u001b\[1A/gm, '')
      .replace(/\u001b\[7D/gm, '')
      .replace(/\u001b\[7C/gm, '')
      .replace(/\u001b\[\?\d{1,4}l/gm, '')
      .replace(/\u001b\[\?\d{1,4}h/gm, '')
      .replace(/\u001b\[\d{1,4}C/gm, '')
      .replace(/\u001b\[\d{1,4}D/gm, '')
      .replace(/\u001b\[\d{1,4}K/gm, '')
      .replace(/\u001b\[\d{1,4}m/gm, '')
      .replace(/\u001b\[\d{1,4}l/gm, '')
      .trim();

    const splittedStepLines = _.compact(prettifiedStep.split('\n'));

    if (!_.isEmpty(splittedStepLines)) {
      const isOnlyOneMessageInStep = splittedStepLines.length < 2;

      const isFirstStep = _.isEmpty(result);

      if (isFirstStep || isOnlyOneMessageInStep) {
        result.push(splittedStepLines);
      } else {
        const [previousStepResult, ...restLines] = splittedStepLines;
        if (previousStepResult) {
          result.push([previousStepResult]);
        }
        result.push(restLines);
      }
    }

    return result;
  }, []);

  if (process.env.LOG_LEVEL === 'debug') {
    console.log(prettifiedData);
  }

  return prettifiedData;
}

function _readFile(externalContext, cb) {
  const {pathToFile} = externalContext;

  return fs.readFile(pathToFile, 'utf8', (err, data) => {
    if (err) {
      return cb(err);
    }

    externalContext.data = JSON.parse(data);

    return cb(null, externalContext);
  });
}

function readFile(pathToFile) {
  return new Promise((resolve, reject) => {
    _readFile({pathToFile}, (err, result) => {
      if (err) {
        return reject(err);
      }
    
      return resolve(result.data);
    });
  });
}

function _filterTestData(externalContext, cb) {
  const {data, filteredObject} = externalContext;
  const filterIndex = _.findIndex(data, filteredObject);

  if (filterIndex >= 0) {
    data.splice(filterIndex, 1);
  }

  return async.setImmediate(() => cb(null, externalContext));
}

function _writeFile(externalContext, cb) {
  const {data, pathToFile} = externalContext;
  const endpoints = JSON.stringify(data);

  return fs.writeFile(pathToFile, endpoints, 'utf8', err => {
    return cb(err);
  });
}

function clearFileFromTestedData(externalContext, done) {
  return async.waterfall([
    async.constant(externalContext),
    _readFile,
    _filterTestData,
    _writeFile
  ], err => {
    return done(err);
  });
}