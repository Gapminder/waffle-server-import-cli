const bunyan = require('bunyan');
const path = require('path');

const ENV = process.env.ENV || 'production';

const levelsByEnvironment = {
  local: 'debug',
  development: 'debug',
  production: 'error',
  stage: 'error',
  test: 'debug'
};

const rotatingFile = {
  type: 'rotating-file',
  path: path.resolve(__dirname, '../logs/cli-tool.log'),
  period: 'daily',
  count: 1
};

const consoleStream = {
  stream: process.stdout
};

const streamsByEnvironment = {
  local: [rotatingFile, consoleStream],
  development: [rotatingFile],
  production: [rotatingFile],
  stage: [rotatingFile],
  test: [rotatingFile]
};

module.exports = bunyan.createLogger({
  name: 'CLI_TOOL',
  level: levelsByEnvironment[ENV],
  streams: streamsByEnvironment[ENV]
});