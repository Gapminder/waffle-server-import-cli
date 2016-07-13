#! /usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
const appPath = path.join(home,".ws-importer-cli");

if(!fs.existsSync(appPath)) {
  fs.mkdirSync(appPath);
}

// Not enough permissions to work in lib folder
// var appDir = path.dirname(require.main.filename);
// process.env.APP_PATH = appDir;

// SETUP PATH FOR LOCAL DYNAMIC FILES
process.env.APP_PATH = appPath;

require('./index');