const bunyan = require('bunyan');
const path = require('path');

module.exports = bunyan.createLogger({
  name: 'CLI_TOOL',
  level: process.env.LOG_LEVEL || 'info',
  streams: [{
    type: 'rotating-file',
    path: path.join(process.cwd(), 'logs/cli-tool\.log'),
    period: 'daily',
    count: 3        // keep 3 back copies
  }]
});