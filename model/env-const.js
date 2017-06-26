'use strict';

const path = require('path');
const appDirBase = path.dirname(__dirname);

let appDir = appDirBase;
if(!!process.env.APP_PATH) {
  appDir = process.env.APP_PATH;
}

const appDirRepos = path.join(appDir, "repos", path.sep);
const appDirRequests = path.join(appDir, "requests", path.sep);
const appDirConfig = path.join(appDir, "config", path.sep);
const appEnv = process.env.ENV || 'production';

module.exports = {
  'PATH_APP': appDir,
  'PATH_APP_BASE': appDirBase,
  'PATH_REPOS': appDirRepos,
  'PATH_REQUESTS': appDirRequests,
  'PATH_CONFIG': appDirConfig,
  ENV: appEnv,
  IS_NOT_PRODUCTION_ENV: appEnv !== 'production',
  IS_TEST_ENV: appEnv === 'test',
  IS_DEVELOPMENT_ENV: appEnv === 'development',
  IS_LOCAL_ENV: appEnv === 'local'
};