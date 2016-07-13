'use strict';

const path = require('path');
let appDirBase = path.dirname(require.main.filename);

let appDir = appDirBase;
if(!!process.env.APP_PATH) {
  appDir = process.env.APP_PATH;
}

const appDirRepos = path.join(appDir, "repos", path.sep);
const appDirRequests = path.join(appDir, "requests", path.sep);
const appDirConfig = path.join(appDir, "config", path.sep);

module.exports = {
  'PATH_APP': appDir,
  'PATH_APP_BASE': appDirBase,
  'PATH_REPOS': appDirRepos,
  'PATH_REQUESTS': appDirRequests,
  'PATH_CONFIG': appDirConfig
};