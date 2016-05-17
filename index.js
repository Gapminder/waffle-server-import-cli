var holder = require('./model/value-holder');
var request = require('request-defaults');

request.api = request.defaults({
  timeout: 30*1000,
  json: true
});

/************************************** REQUIRE STEPS *****************************************************************/

var stepAuthentificationLogin = require('./steps/authentification-login');
var stepAuthentificationPassword = require('./steps/authentification-password');
var stepChooseFlow = require('./steps/choose-flow');

var flowImportTranslationsSource = require('./steps/flow-import-translations-source');

var flowImportDataSetChoose = require('./steps/flow-import-dataset-choose');
var flowImportDataSetPath = require('./steps/flow-import-dataset-path');
var flowImportDataSetUpdateHashFrom = require('./steps/flow-import-dataset-update-hash-from');
var flowImportDataSetUpdateHashTo = require('./steps/flow-import-dataset-update-hash-to');

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

var stepExitStrategy = {};
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

var flowImportTranslationsSourceStrategy = {};
flowImportTranslationsSourceStrategy[flowImportTranslationsSource.step.choices[0]] = wayImportTranslationContentfulSpaceId;
flowImportTranslationsSourceStrategy[flowImportTranslationsSource.step.choices[1]] = wayImportTranslationFilesystemPath;
flowImportTranslationsSourceStrategy[flowImportTranslationsSource.step.choices[3]] = stepChooseFlow;

flowImportTranslationsSource.setNextStrategy(flowImportTranslationsSourceStrategy);
flowImportDataSetPath.setNext(stepExit);


/************************************** STEP :: Import DataSet ********************************************************/

flowImportDataSetUpdateHashTo.setNext(stepExit);
flowImportDataSetUpdateHashFrom.setNext(flowImportDataSetUpdateHashTo);

var flowImportDataSetChooseStrategy = {};
flowImportDataSetChooseStrategy[flowImportDataSetChoose.step.choices[0]] = flowImportDataSetPath;
flowImportDataSetChooseStrategy[flowImportDataSetChoose.step.choices[1]] = flowImportDataSetUpdateHashFrom;
flowImportDataSetChooseStrategy[flowImportDataSetChoose.step.choices[3]] = stepChooseFlow;

flowImportDataSetChoose.setNextStrategy(flowImportDataSetChooseStrategy);

/************************************** STEP :: Choose Flow ***********************************************************/

var stepChooseFlowStrategy = {};
stepChooseFlowStrategy[stepChooseFlow.step.choices[0]] = flowImportTranslationsSource;
stepChooseFlowStrategy[stepChooseFlow.step.choices[1]] = flowImportDataSetChoose;
stepChooseFlowStrategy[stepChooseFlow.step.choices[2]] = stepPublishDataSetNonPublished;
stepChooseFlowStrategy[stepChooseFlow.step.choices[4]] = false;

stepChooseFlow.setNextStrategy(stepChooseFlowStrategy);

/************************************** STEP :: Authentification ******************************************************/

stepAuthentificationPassword.setNext(stepChooseFlow);
stepAuthentificationLogin.setNext(stepAuthentificationPassword);

/************************************** PROCESS ***********************************************************************/

startAction.run(holder);
// flow.start(AuthStep).then(WporlStep).if(SuccesStep, FailStep).end(Step);