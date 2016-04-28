var holder = require('./model/value-holder');
var request = require('request-defaults');

request.api = request.defaults({timeout: 30*1000});

/************************************** REQUIRE STEPS *****************************************************************/

var stepAuthentificationLogin = require('./steps/authentification-login');
var stepAuthentificationPassword = require('./steps/authentification-password');
var stepChooseFlow = require('./steps/choose-flow');

var flowImportTranslationsSource = require('./steps/flow-import-translations-source');
var flowImportDataSetPath = require('./steps/flow-import-dataset-path');

var stepPublishDataSetNonPublished = require('./steps/flow-publish-dataset-non-published');
var flowPublishDataSetVersion = require('./steps/flow-publish-dataset-version');

var wayImportTranslationContentfulSpaceId = require('./steps/way-import-translation-contentful-spaceid');
var wayImportTranslationContentfulAccessToken = require('./steps/way-import-translation-contentful-accesstoken');
var wayImportTranslationFilesystemPath = require('./steps/way-import-translation-filesystem-path');
var wayImportTranslationFilesystemFilelist = require('./steps/way-import-translation-filesystem-filelist');
var wayImportTranslationFilesystemDatasets = require('./steps/way-import-translation-filesystem-datasets');

var stepExit = require('./steps/exit');

/************************************** SET UP :: First Action ********************************************************/

var startAction = stepAuthentificationLogin;
//var startAction = stepChooseFlow;

/************************************** SET UP :: Last Action *********************************************************/

var exitStrategyChooseFlow = {};
exitStrategyChooseFlow[stepExit.step.choices[0]] = stepChooseFlow;
exitStrategyChooseFlow[stepExit.step.choices[1]] = false;
stepExit.setNextStrategy(exitStrategyChooseFlow);

/************************************** STEP :: Import Translation :: Contentful **************************************/

// ToDo :: CLARIFY FLOW
wayImportTranslationContentfulAccessToken.setNext(stepExit);
wayImportTranslationContentfulSpaceId.setNext(wayImportTranslationContentfulAccessToken);

/************************************** STEP :: Import Translation :: Filesystem **************************************/

wayImportTranslationFilesystemDatasets.setNext(stepExit);
wayImportTranslationFilesystemFilelist.setNext(wayImportTranslationFilesystemDatasets);
wayImportTranslationFilesystemPath.setNext(wayImportTranslationFilesystemFilelist);

/************************************** STEP :: Publish DataSet *******************************************************/

flowPublishDataSetVersion.setNext(stepExit);

/************************************** STEP :: Choose Flow ***********************************************************/

var flowStrategyChooseFlow = {};
flowStrategyChooseFlow[flowImportTranslationsSource.step.choices[0]] = wayImportTranslationContentfulSpaceId;
flowStrategyChooseFlow[flowImportTranslationsSource.step.choices[1]] = wayImportTranslationFilesystemPath;
flowStrategyChooseFlow[flowImportTranslationsSource.step.choices[3]] = stepChooseFlow;

flowImportTranslationsSource.setNextStrategy(flowStrategyChooseFlow);
flowImportDataSetPath.setNext(stepExit);
stepPublishDataSetNonPublished.setNext(flowPublishDataSetVersion);

/************************************** STEP :: Choose Flow ***********************************************************/

var flowStrategyChooseFlow = {};
flowStrategyChooseFlow[stepChooseFlow.step.choices[0]] = flowImportTranslationsSource;
flowStrategyChooseFlow[stepChooseFlow.step.choices[1]] = flowImportDataSetPath;
flowStrategyChooseFlow[stepChooseFlow.step.choices[2]] = stepPublishDataSetNonPublished;
flowStrategyChooseFlow[stepChooseFlow.step.choices[4]] = false;

stepChooseFlow.setNextStrategy(flowStrategyChooseFlow);

/************************************** STEP :: Authentification ******************************************************/

stepAuthentificationPassword.setNext(stepChooseFlow);
stepAuthentificationLogin.setNext(stepAuthentificationPassword);

/************************************** PROCESS ***********************************************************************/

startAction.run(holder);
// flow.start(AuthStep).then(WporlStep).if(SuccesStep, FailStep).end(Step);