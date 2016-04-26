'use strict';

const path = require('path');
let appDir = path.dirname(require.main.filename);

if(!!process.env.APP_PATH) {
  appDir = process.env.APP_PATH;
}

const appDirRepos = path.join(appDir, "repos", path.sep);
const appDirRequests = path.join(appDir, "requests", path.sep);
const appDirConfig = path.join(appDir, "config", path.sep);

module.exports = {
  'PATH_APP': appDir,
  'PATH_REPOS': appDirRepos,
  'PATH_REQUESTS': appDirRequests,
  'PATH_CONFIG': appDirConfig
};