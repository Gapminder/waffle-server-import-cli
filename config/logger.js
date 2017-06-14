const bunyan = require('bunyan');

module.exports = bunyan.createLogger({
  name: 'rotating-file',
  streams: [{
    type: 'rotating-file',
    path: './logs/cli-tool\.log',
    period: '1d',   // daily rotation
    count: 3        // keep 3 back copies
  }]
});