
var holder = require('./model/value-holder');

var stepAuthentificationLogin = require('./steps/authentification-login');
var stepAuthentificationPassword = require('./steps/authentification-password');
var stepChooseFlow = require('./steps/choose-flow');

var stepImportTranslations = require('./steps/flow-import-translations');
var stepImportDataSet = require('./steps/flow-import-dataset');
var stepPublishDataSet = require('./steps/flow-publish-dataset');

var wayImportTranslationContentfulSpaceId = require('./steps/way-import-translation-contentful-spaceid');
var wayImportTranslationContentfulAccessToken = require('./steps/way-import-translation-contentful-accesstoken');
var wayImportTranslationFilesystemPath = require('./steps/way-import-translation-filesystem-path');
var wayImportTranslationFilesystemFilelist = require('./steps/way-import-translation-filesystem-filelist');
var wayImportTranslationFilesystemDatasets = require('./steps/way-import-translation-filesystem-datasets');

var stepExit = require('./steps/exit');

/************************************** SET UP :: First Action ********************************************************/

var startAction = stepAuthentificationLogin;
var startAction = stepChooseFlow;

/************************************** SET UP :: Last Action *********************************************************/

var exitStrategyChooseFlow = {};
exitStrategyChooseFlow[stepExit.step.choices[0]] = stepChooseFlow;
exitStrategyChooseFlow[stepExit.step.choices[1]] = false;
stepExit.setNextStrategy(exitStrategyChooseFlow);

/************************************** STEP :: Contentful ************************************************************/

wayImportTranslationContentfulAccessToken.setNext(false);
wayImportTranslationContentfulSpaceId.setNext(wayImportTranslationContentfulAccessToken);

/************************************** STEP :: Filesystem ************************************************************/

wayImportTranslationFilesystemDatasets.setNext(stepExit);
wayImportTranslationFilesystemFilelist.setNext(wayImportTranslationFilesystemDatasets);
wayImportTranslationFilesystemPath.setNext(wayImportTranslationFilesystemFilelist);

/************************************** STEP :: Choose Flow ***********************************************************/

var flowStrategyChooseFlow = {};
flowStrategyChooseFlow[stepImportTranslations.step.choices[0]] = wayImportTranslationContentfulSpaceId;
flowStrategyChooseFlow[stepImportTranslations.step.choices[1]] = wayImportTranslationFilesystemPath;
flowStrategyChooseFlow[stepImportTranslations.step.choices[3]] = stepChooseFlow;

stepImportTranslations.setNextStrategy(flowStrategyChooseFlow);
stepImportDataSet.setNext(false);
stepPublishDataSet.setNext(false);

/************************************** STEP :: Choose Flow ***********************************************************/

var flowStrategyChooseFlow = {};
flowStrategyChooseFlow[stepChooseFlow.step.choices[0]] = stepImportTranslations;
flowStrategyChooseFlow[stepChooseFlow.step.choices[1]] = stepImportDataSet;
flowStrategyChooseFlow[stepChooseFlow.step.choices[2]] = stepPublishDataSet;
flowStrategyChooseFlow[stepChooseFlow.step.choices[4]] = false;

stepChooseFlow.setNextStrategy(flowStrategyChooseFlow);

/************************************** STEP :: Authentification ******************************************************/

stepAuthentificationPassword.setNext(stepChooseFlow);
stepAuthentificationLogin.setNext(stepAuthentificationPassword);

/************************************** RUN ***************************************************************************/

startAction.run(holder);

// flow.start(AuthStep).then(WporlStep).if(SuccesStep, FailStep).end(Step);
