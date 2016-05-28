'use strict';

let holder = require('./model/value-holder');
let request = require('request-defaults');

request.api = request.defaults({
  timeout: 30*1000,
  json: true
});

/************************************** REQUIRE STEPS *****************************************************************/

let stepAuthentificationLogin = require('./steps/authentification-login');
let stepAuthentificationPassword = require('./steps/authentification-password');
let stepChooseFlow = require('./steps/choose-flow');

let flowImportTranslationsSource = require('./steps/disabled/flow-import-translations-source');

let flowUpdateDataSetChoose = require('./steps/flow-update-dataset-choose');

let flowImportDataSetChoose = require('./steps/flow-import-dataset-choose');
let flowImportDataSetPath = require('./steps/disabled/flow-import-dataset-path');

let flowUpdateDataSetHashFrom = require('./steps/flow-update-dataset-hash-from');
let flowUpdateDataSetHashTo = require('./steps/flow-update-dataset-hash-to');

let stepPublishDataSetNonPublished = require('./steps/disabled/flow-publish-dataset-non-published');
let flowPublishDataSetVersion = require('./steps/disabled/flow-publish-dataset-version');

let wayImportTranslationContentfulSpaceId = require('./steps/disabled/way-import-translation-contentful-spaceid');
let wayImportTranslationContentfulAccessToken = require('./steps/disabled/way-import-translation-contentful-accesstoken');
let wayImportTranslationFilesystemPath = require('./steps/disabled/way-import-translation-filesystem-path');
let wayImportTranslationFilesystemFilelist = require('./steps/disabled/way-import-translation-filesystem-filelist');
let wayImportTranslationFilesystemDatasets = require('./steps/disabled/way-import-translation-filesystem-datasets');

let stepExit = require('./steps/exit');

/************************************** SET UP :: Last Action *********************************************************/

let stepExitStrategy = {};
stepExitStrategy[stepExit.step.choices[0]] = stepChooseFlow;
stepExitStrategy[stepExit.step.choices[1]] = false;
stepExit.setNextStrategy(stepExitStrategy);

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
stepPublishDataSetNonPublished.setNext(flowPublishDataSetVersion);

/************************************** STEP :: Import Translations ***************************************************/

let flowImportTranslationsSourceStrategy = {};
flowImportTranslationsSourceStrategy[flowImportTranslationsSource.step.choices[0]] = wayImportTranslationContentfulSpaceId;
flowImportTranslationsSourceStrategy[flowImportTranslationsSource.step.choices[1]] = wayImportTranslationFilesystemPath;
flowImportTranslationsSourceStrategy[flowImportTranslationsSource.step.choices[3]] = stepChooseFlow;

flowImportTranslationsSource.setNextStrategy(flowImportTranslationsSourceStrategy);
flowImportDataSetPath.setNext(stepExit);

/************************************** STEP :: Update DataSet ********************************************************/

flowUpdateDataSetHashTo.setNext(stepChooseFlow);
flowUpdateDataSetHashFrom.setNext(flowUpdateDataSetHashTo);

let flowUpdateDataSetChooseStrategy = {};
flowUpdateDataSetChooseStrategy[flowUpdateDataSetChoose.step.choices[0].value] = flowUpdateDataSetHashFrom;
flowUpdateDataSetChooseStrategy[flowUpdateDataSetChoose.step.choices[1].value] = flowUpdateDataSetHashFrom;
flowUpdateDataSetChooseStrategy[flowUpdateDataSetChoose.step.choices[3]] = stepChooseFlow;

flowUpdateDataSetChoose.setNextStrategy(flowUpdateDataSetChooseStrategy);

/************************************** STEP :: Import DataSet ********************************************************/

/*
flowUpdateDataSetHashTo.setNext(stepExit);
flowUpdateDataSetHashFrom.setNext(flowUpdateDataSetHashTo);

let flowImportDataSetChooseStrategy = {};
flowImportDataSetChooseStrategy[flowImportDataSetChoose.step.choices[0]] = flowImportDataSetPath;
flowImportDataSetChooseStrategy[flowImportDataSetChoose.step.choices[1]] = flowUpdateDataSetHashFrom;
flowImportDataSetChooseStrategy[flowImportDataSetChoose.step.choices[3]] = stepChooseFlow;
*/

let flowImportDataSetChooseStrategy = {};

flowImportDataSetChooseStrategy[flowImportDataSetChoose.step.choices[0].value] = stepChooseFlow;
flowImportDataSetChooseStrategy[flowImportDataSetChoose.step.choices[1].value] = stepChooseFlow;
flowImportDataSetChooseStrategy[flowImportDataSetChoose.step.choices[3]] = stepChooseFlow;

flowImportDataSetChoose.setNextStrategy(flowImportDataSetChooseStrategy);

/************************************** STEP :: Choose Flow ***********************************************************/

let stepChooseFlowStrategy = {};
stepChooseFlowStrategy[stepChooseFlow.step.choices[0].value] = flowImportDataSetChoose;
stepChooseFlowStrategy[stepChooseFlow.step.choices[1].value] = flowUpdateDataSetChoose;
stepChooseFlowStrategy[stepChooseFlow.step.choices[2].value] = stepChooseFlow;
stepChooseFlowStrategy[stepChooseFlow.step.choices[4]] = false;

//stepChooseFlowStrategy[stepChooseFlow.step.choices[2].value] = flowImportTranslationsSource;
//stepChooseFlowStrategy[stepChooseFlow.step.choices[3].value] = stepPublishDataSetNonPublished;

stepChooseFlow.setNextStrategy(stepChooseFlowStrategy);

/************************************** STEP :: Authentification ******************************************************/

stepAuthentificationPassword.setNext(stepChooseFlow);
stepAuthentificationLogin.setNext(stepAuthentificationPassword);

/************************************** PROCESS ***********************************************************************/

/************************************** SET UP :: First Action ********************************************************/

//let startAction = stepAuthentificationLogin;
let startAction = stepChooseFlow;

startAction.run(holder);
// flow.start(AuthStep).then(WporlStep).if(SuccesStep, FailStep).end(Step);