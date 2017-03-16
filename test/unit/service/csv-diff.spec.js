'use strict';

const async = require('async');
const path = require('path');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sinonChaiInOrder = require('sinon-chai-in-order');
const expect = chai.expect;
chai.use(sinonChai);
chai.use(sinonChaiInOrder.default);

const gitFlow = require('../../../service/git-flow');
const cliUi = require('../../../service/cli-ui');
const gitCsvDiff = require('git-csv-diff');

describe('Service: CSV diff', function () {
  it('should generate csv diff', sinon.test(function (done) {

    // *** *** *** *** *** ***  ***
    // *** Fixtures for Arrange ***
    // *** *** *** *** *** ***  ***

    const expectedError = null;

    const expectedGitDiffFileList = [
      'ddf--concepts.csv',
      'ddf--datapoints--company_scale--by--company--anno.csv',
      'ddf--entities--company--company_scale.csv',
      'lang/nl-nl/ddf--concepts.csv',
      'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv',
      'lang/nl-nl/ddf--entities--company--company_scale.csv'
    ];

    const expectedMetadata = {
      datapackageOld: sinon.match.object,
      datapackageNew: sinon.match.object
    };

    const expectedGitDiffFileStatus = {
      'ddf--concepts.csv': 'M',
      'ddf--datapoints--company_scale--by--company--anno.csv': 'A',
      'ddf--entities--company--company_scale.csv': 'A',
      'lang/nl-nl/ddf--concepts.csv': 'A',
      'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv': 'A',
      'lang/nl-nl/ddf--entities--company--company_scale.csv': 'A'
    };

    const expectedResultFiles = {
      diff: path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--output.txt'),
      fileList: expectedGitDiffFileList,
      lang: path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--lang--output.txt')
    };

    const expectedDataDiff = {
      from: 'concept,concept_type,domain\ncompany,entity_domain,\nenglish_speaking,entity_set,company\nfoundation,entity_set,company\ncompany_size,entity_set,company\nname,string,\nanno,time,\nlines_of_code,measure,\nregion,entity_domain,\ncountry,string,\nnum_users,measure,\nlatitude,measure,\nlongitude,measure,\nfull_name,string,\nproject,entity_domain,\ndomain,string,\n',
      to: 'concept,concept_type,domain,additional_column\ncompany,entity_domain,,\nenglish_speaking,entity_set,company,\ncompany_scale,entity_set,company,updated\nname,string,,\nanno,time,,\nlines_of_code,measure,,\nregion,entity_domain,,\ncountry,string,,\nlatitude,measure,,\nlongitude,measure,,\nfull_name_changed,string,,new value and change concept\nproject,entity_domain,,\ndomain,string,,\nadditional_column,string,,new row and column\nmeeting_style,string,,\npopular_appeal,string,,\nmethodology,string,,\n'
    };

    const expectedEmptyDataDiff = {
      from: '',
      to: ''
    };

    const getFileDiffByHashesResult = {
      gitDiffFileList: expectedGitDiffFileList,
      metadata: expectedMetadata,
      gitDiffFileStatus: expectedGitDiffFileStatus
    };

    // *** *** *** *** ***  ***
    // *** Fixtures for Act ***
    // *** *** *** *** ***  ***

    const hashFrom = 'aaaaaaa';
    const hashTo = 'bbbbbbb';
    const github = 'git@github.com:VS-work/ddf--ws-testing.git';
    const options = {hashFrom, hashTo, github};

    // *** *** *** *** *** *** ***
    // *** Fixtures for Assert ***
    // *** *** *** *** *** *** ***

    const expectedSourceFolderPath = path.resolve('', 'requests') + '/';

    const expectedStreams = {
      diff: sinon.match.object,
      lang: sinon.match.object
    };

    const expectedContext = {
      sourceFolderPath: expectedSourceFolderPath,
      hashFrom,
      hashTo,
      github,
      resultFileName: path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--output.txt'),
      resultFileLangName: path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--lang--output.txt'),
      gitDiffFileStatus: expectedGitDiffFileStatus,
      gitDiffFileList: expectedGitDiffFileList,
      metadata: expectedMetadata,
      streams: expectedStreams
    };

    const expectedMetaDataForUpdate = {
      fileName: sinon.match(expectedGitDiffFileList[0])
        .or(sinon.match(expectedGitDiffFileList[1]))
        .or(sinon.match(expectedGitDiffFileList[2]))
        .or(sinon.match(expectedGitDiffFileList[3]))
        .or(sinon.match(expectedGitDiffFileList[4]))
        .or(sinon.match(expectedGitDiffFileList[5])),
      fileModifier: sinon.match('A').or(sinon.match('M')),
      datapackage: {
        old: expectedMetadata.datapackageOld,
        new: expectedMetadata.datapackageNew
      }
    };

    // *** Arrange

    const getFileDiffByHashesStub = this.stub(gitFlow, 'getFileDiffByHashes').callsArgWithAsync(1, expectedError, getFileDiffByHashesResult);

    const getDiffFileNameResultStub = this.stub(gitFlow, 'getDiffFileNameResult');
    getDiffFileNameResultStub
      .onFirstCall().returns(path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--output.txt'))
      .onSecondCall().returns(path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--lang--output.txt'));
    getDiffFileNameResultStub.threw('Should be never called');

    const showFileStateByHashStub = this.stub(gitFlow, 'showFileStateByHash');
    showFileStateByHashStub.onFirstCall().callsArgWithAsync(2, expectedError, expectedDataDiff);
    showFileStateByHashStub.callsArgWithAsync(2, null, expectedEmptyDataDiff);

    const processUpdatedStub = this.stub(gitCsvDiff, 'processUpdated').callsArgWithAsync(3);
    const stopStub = this.stub(cliUi, 'stop').returns(cliUi);
    const successStub = this.stub(cliUi, 'success').returns(cliUi);

    const csvDiff = require('../../../service/csv-diff');

    // *** Act

    return csvDiff.process(options, (error, resultFiles) => {

      // *** Assert

      expect(error).to.not.exist;
      expect(resultFiles).to.be.deep.equal(expectedResultFiles);

      sinon.assert.calledOnce(getFileDiffByHashesStub);
      sinon.assert.calledWithExactly(getFileDiffByHashesStub, sinon.match(expectedContext), sinon.match.func);

      sinon.assert.calledTwice(getDiffFileNameResultStub);
      expect(getDiffFileNameResultStub).inOrder.to.have.been.calledWithExactly(expectedSourceFolderPath, github)
        .subsequently.calledWithExactly(expectedSourceFolderPath, github, 'lang');

      sinon.assert.callCount(showFileStateByHashStub, 6);
      expect(showFileStateByHashStub).inOrder.to.have.been.calledWithExactly(expectedContext, expectedGitDiffFileList[0], sinon.match.func)
        .subsequently.calledWithExactly(expectedContext, expectedGitDiffFileList[1], sinon.match.func)
        .subsequently.calledWithExactly(expectedContext, expectedGitDiffFileList[2], sinon.match.func)
        .subsequently.calledWithExactly(expectedContext, expectedGitDiffFileList[3], sinon.match.func)
        .subsequently.calledWithExactly(expectedContext, expectedGitDiffFileList[4], sinon.match.func)
        .subsequently.calledWithExactly(expectedContext, expectedGitDiffFileList[5], sinon.match.func);

      sinon.assert.callCount(processUpdatedStub, 6);
      expect(processUpdatedStub).inOrder
        .to.have.been.calledWithExactly(sinon.match(expectedMetaDataForUpdate), sinon.match(expectedDataDiff), sinon.match(expectedStreams), sinon.match.func)
        .subsequently.calledWithExactly(sinon.match(expectedMetaDataForUpdate), sinon.match(expectedEmptyDataDiff), sinon.match(expectedStreams), sinon.match.func)
        .subsequently.calledWithExactly(sinon.match(expectedMetaDataForUpdate), sinon.match(expectedEmptyDataDiff), sinon.match(expectedStreams), sinon.match.func)
        .subsequently.calledWithExactly(sinon.match(expectedMetaDataForUpdate), sinon.match(expectedEmptyDataDiff), sinon.match(expectedStreams), sinon.match.func)
        .subsequently.calledWithExactly(sinon.match(expectedMetaDataForUpdate), sinon.match(expectedEmptyDataDiff), sinon.match(expectedStreams), sinon.match.func)
        .subsequently.calledWithExactly(sinon.match(expectedMetaDataForUpdate), sinon.match(expectedEmptyDataDiff), sinon.match(expectedStreams), sinon.match.func);

      sinon.assert.calledOnce(stopStub);
      sinon.assert.calledWithExactly(stopStub);
      sinon.assert.calledOnce(successStub);
      sinon.assert.calledWithExactly(successStub, '* Diff generation completed!');

      return done();
    });
  }));

  it('should interrupt generation csv diff, when error happen during getting list of file changes', sinon.test(function (done) {

    // *** *** *** *** *** ***  ***
    // *** Fixtures for Arrange ***
    // *** *** *** *** *** ***  ***

    const expectedError = 'BOOM!';

    // *** *** *** *** ***  ***
    // *** Fixtures for Act ***
    // *** *** *** *** ***  ***

    const hashFrom = 'aaaaaaa';
    const hashTo = 'bbbbbbb';
    const github = 'git@github.com:VS-work/ddf--ws-testing.git';
    const options = {hashFrom, hashTo, github};

    // *** *** *** *** *** *** ***
    // *** Fixtures for Assert ***
    // *** *** *** *** *** *** ***

    const expectedSourceFolderPath = '/home/vs/Projects/ws-vizabi/waffle-server-import-cli/requests/';

    const expectedContext = {
      sourceFolderPath: expectedSourceFolderPath,
      hashFrom,
      hashTo,
      github
    };

    // *** Arrange

    const getFileDiffByHashesStub = this.stub(gitFlow, 'getFileDiffByHashes').callsArgWithAsync(1, expectedError);
    const getDiffFileNameResultStub = this.stub(gitFlow, 'getDiffFileNameResult');
    const showFileStateByHashStub = this.stub(gitFlow, 'showFileStateByHash');
    const processUpdatedStub = this.stub(gitCsvDiff, 'processUpdated');
    const stopStub = this.stub(cliUi, 'stop').returns(cliUi);
    const successStub = this.stub(cliUi, 'success').returns(cliUi);

    const csvDiff = require('../../../service/csv-diff');

    // *** Act

    return csvDiff.process(options, (error, resultFiles) => {

      // *** Assert

      expect(error).to.be.equal(expectedError);
      expect(resultFiles).to.not.exist;

      sinon.assert.calledOnce(getFileDiffByHashesStub);
      sinon.assert.calledWithExactly(getFileDiffByHashesStub, sinon.match(expectedContext), sinon.match.func);

      sinon.assert.notCalled(getDiffFileNameResultStub);
      sinon.assert.notCalled(showFileStateByHashStub);
      sinon.assert.notCalled(processUpdatedStub);
      sinon.assert.notCalled(stopStub);
      sinon.assert.notCalled(successStub);

      return done();
    });
  }));

  it('should interrupt generation csv diff, when error happen during show file state', sinon.test(function (done) {

    // *** *** *** *** *** ***  ***
    // *** Fixtures for Arrange ***
    // *** *** *** *** *** ***  ***

    const expectedError = 'BOOM!';

    const expectedGitDiffFileList = [
      'ddf--concepts.csv',
      'ddf--datapoints--company_scale--by--company--anno.csv',
      'ddf--entities--company--company_scale.csv',
      'lang/nl-nl/ddf--concepts.csv',
      'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv',
      'lang/nl-nl/ddf--entities--company--company_scale.csv'
    ];

    const expectedMetadata = {
      datapackageOld: sinon.match.object,
      datapackageNew: sinon.match.object
    };

    const expectedGitDiffFileStatus = {
      'ddf--concepts.csv': 'M',
      'ddf--datapoints--company_scale--by--company--anno.csv': 'A',
      'ddf--entities--company--company_scale.csv': 'A',
      'lang/nl-nl/ddf--concepts.csv': 'A',
      'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv': 'A',
      'lang/nl-nl/ddf--entities--company--company_scale.csv': 'A'
    };

    const getFileDiffByHashesResult = {
      gitDiffFileList: expectedGitDiffFileList,
      metadata: expectedMetadata,
      gitDiffFileStatus: expectedGitDiffFileStatus
    };

    // *** *** *** *** ***  ***
    // *** Fixtures for Act ***
    // *** *** *** *** ***  ***

    const hashFrom = 'aaaaaaa';
    const hashTo = 'bbbbbbb';
    const github = 'git@github.com:VS-work/ddf--ws-testing.git';
    const options = {hashFrom, hashTo, github};

    // *** *** *** *** *** *** ***
    // *** Fixtures for Assert ***
    // *** *** *** *** *** *** ***

    const expectedSourceFolderPath = path.resolve('', 'requests') + '/';

    const expectedStreams = {
      'diff': sinon.match.object,
      'lang': sinon.match.object
    };

    const expectedContext = {
      sourceFolderPath: expectedSourceFolderPath,
      hashFrom,
      hashTo,
      github,
      resultFileName: path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--output.txt'),
      resultFileLangName: path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--lang--output.txt'),
      gitDiffFileStatus: expectedGitDiffFileStatus,
      gitDiffFileList: expectedGitDiffFileList,
      metadata: expectedMetadata,
      streams: expectedStreams
    };

    // *** Arrange

    const getFileDiffByHashesStub = this.stub(gitFlow, 'getFileDiffByHashes').callsArgWithAsync(1, null, getFileDiffByHashesResult);

    const getDiffFileNameResultStub = this.stub(gitFlow, 'getDiffFileNameResult');
    getDiffFileNameResultStub
      .onFirstCall().returns(path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--output.txt'))
      .onSecondCall().returns(path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--lang--output.txt'));
    getDiffFileNameResultStub.threw('Should be never called');

    const showFileStateByHashStub = this.stub(gitFlow, 'showFileStateByHash');
    showFileStateByHashStub.onFirstCall().callsArgWithAsync(2, expectedError);

    const processUpdatedStub = this.stub(gitCsvDiff, 'processUpdated');
    const stopStub = this.stub(cliUi, 'stop').returns(cliUi);
    const successStub = this.stub(cliUi, 'success').returns(cliUi);

    const csvDiff = require('../../../service/csv-diff');

    // *** Act

    return csvDiff.process(options, (error, resultFiles) => {

      // *** Assert

      expect(error).to.be.equal(expectedError);
      expect(resultFiles).to.not.exist;

      sinon.assert.calledOnce(getFileDiffByHashesStub);
      sinon.assert.calledWithExactly(getFileDiffByHashesStub, sinon.match(expectedContext), sinon.match.func);

      sinon.assert.calledTwice(getDiffFileNameResultStub);
      expect(getDiffFileNameResultStub).inOrder
        .to.have.been.calledWithExactly(expectedSourceFolderPath, github)
        .subsequently.calledWithExactly(expectedSourceFolderPath, github, 'lang');

      sinon.assert.calledOnce(showFileStateByHashStub);
      sinon.assert.calledWithExactly(showFileStateByHashStub, expectedContext, expectedGitDiffFileList[0], sinon.match.func);

      sinon.assert.notCalled(processUpdatedStub);
      sinon.assert.notCalled(stopStub);
      sinon.assert.notCalled(successStub);

      return done();
    });
  }));

  it('should interrupt generation csv diff, when streams doesn\'t present in context', sinon.test(function (done) {

    // *** *** *** *** *** ***  ***
    // *** Fixtures for Arrange ***
    // *** *** *** *** *** ***  ***

    const expectedError = null;

    const expectedGitDiffFileList = [
      'ddf--concepts.csv',
      'ddf--datapoints--company_scale--by--company--anno.csv',
      'ddf--entities--company--company_scale.csv',
      'lang/nl-nl/ddf--concepts.csv',
      'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv',
      'lang/nl-nl/ddf--entities--company--company_scale.csv'
    ];

    const expectedMetadata = {
      datapackageOld: sinon.match.object,
      datapackageNew: sinon.match.object
    };

    const expectedGitDiffFileStatus = {
      'ddf--concepts.csv': 'M',
      'ddf--datapoints--company_scale--by--company--anno.csv': 'A',
      'ddf--entities--company--company_scale.csv': 'A',
      'lang/nl-nl/ddf--concepts.csv': 'A',
      'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv': 'A',
      'lang/nl-nl/ddf--entities--company--company_scale.csv': 'A'
    };

    const expectedResultFiles = {
      diff: path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--output.txt'),
      fileList: expectedGitDiffFileList,
      lang: path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--lang--output.txt')
    };

    const expectedDataDiff = {
      from: 'concept,concept_type,domain\ncompany,entity_domain,\nenglish_speaking,entity_set,company\nfoundation,entity_set,company\ncompany_size,entity_set,company\nname,string,\nanno,time,\nlines_of_code,measure,\nregion,entity_domain,\ncountry,string,\nnum_users,measure,\nlatitude,measure,\nlongitude,measure,\nfull_name,string,\nproject,entity_domain,\ndomain,string,\n',
      to: 'concept,concept_type,domain,additional_column\ncompany,entity_domain,,\nenglish_speaking,entity_set,company,\ncompany_scale,entity_set,company,updated\nname,string,,\nanno,time,,\nlines_of_code,measure,,\nregion,entity_domain,,\ncountry,string,,\nlatitude,measure,,\nlongitude,measure,,\nfull_name_changed,string,,new value and change concept\nproject,entity_domain,,\ndomain,string,,\nadditional_column,string,,new row and column\nmeeting_style,string,,\npopular_appeal,string,,\nmethodology,string,,\n'
    };

    const expectedEmptyDataDiff = {
      from: '',
      to: ''
    };

    const getFileDiffByHashesResult = {
      gitDiffFileList: expectedGitDiffFileList,
      metadata: expectedMetadata,
      gitDiffFileStatus: expectedGitDiffFileStatus
    };

    // *** *** *** *** ***  ***
    // *** Fixtures for Act ***
    // *** *** *** *** ***  ***

    const hashFrom = 'aaaaaaa';
    const hashTo = 'bbbbbbb';
    const github = 'git@github.com:VS-work/ddf--ws-testing.git';
    const options = {hashFrom, hashTo, github};

    // *** *** *** *** *** *** ***
    // *** Fixtures for Assert ***
    // *** *** *** *** *** *** ***

    const expectedSourceFolderPath = path.resolve('', 'requests') + '/';

    const expectedStreams = {
      diff: sinon.match.object,
      lang: sinon.match.object
    };

    const expectedContext = {
      sourceFolderPath: expectedSourceFolderPath,
      hashFrom,
      hashTo,
      github,
      resultFileName: path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--output.txt'),
      resultFileLangName: path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--lang--output.txt'),
      gitDiffFileStatus: expectedGitDiffFileStatus,
      gitDiffFileList: expectedGitDiffFileList,
      metadata: expectedMetadata,
      streams: sinon.match.object
    };

    const expectedMetaDataForUpdate = {
      fileName: sinon.match(expectedGitDiffFileList[0])
        .or(sinon.match(expectedGitDiffFileList[1]))
        .or(sinon.match(expectedGitDiffFileList[2]))
        .or(sinon.match(expectedGitDiffFileList[3]))
        .or(sinon.match(expectedGitDiffFileList[4]))
        .or(sinon.match(expectedGitDiffFileList[5])),
      fileModifier: sinon.match('A').or(sinon.match('M')),
      datapackage: {
        old: expectedMetadata.datapackageOld,
        new: expectedMetadata.datapackageNew
      }
    };

    // *** Arrange

    const getFileDiffByHashesStub = this.stub(gitFlow, 'getFileDiffByHashes').callsArgWithAsync(1, expectedError, getFileDiffByHashesResult);

    const getDiffFileNameResultStub = this.stub(gitFlow, 'getDiffFileNameResult');
    getDiffFileNameResultStub
      .onFirstCall().returns(path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--output.txt'))
      .onSecondCall().returns(path.resolve('', 'requests/result--VS-work--ddf--ws-testing--master--lang--output.txt'));
    getDiffFileNameResultStub.threw('Should be never called');

    const showFileStateByHashStub = this.stub(gitFlow, 'showFileStateByHash');
    showFileStateByHashStub.onFirstCall().callsArgWithAsync(2, expectedError, expectedDataDiff);
    showFileStateByHashStub.callsArgWithAsync(2, null, expectedEmptyDataDiff);

    const processUpdatedStub = this.stub(gitCsvDiff, 'processUpdated', (metaData, dataDiff, streams, callback) => {
      delete streams.diff;
      delete streams.lang;

      async.setImmediate(() => callback());
    });

    const stopStub = this.stub(cliUi, 'stop').returns(cliUi);
    const successStub = this.stub(cliUi, 'success').returns(cliUi);

    const csvDiff = require('../../../service/csv-diff');

    // *** Act

    return csvDiff.process(options, (error, resultFiles) => {

      // *** Assert

      expect(error).to.not.exist;
      expect(resultFiles).to.be.deep.equal(expectedResultFiles);

      sinon.assert.calledOnce(getFileDiffByHashesStub);
      sinon.assert.calledWithExactly(getFileDiffByHashesStub, sinon.match(expectedContext), sinon.match.func);

      sinon.assert.calledTwice(getDiffFileNameResultStub);
      expect(getDiffFileNameResultStub).inOrder.to.have.been.calledWithExactly(expectedSourceFolderPath, github)
        .subsequently.calledWithExactly(expectedSourceFolderPath, github, 'lang');

      sinon.assert.callCount(showFileStateByHashStub, 6);
      expect(showFileStateByHashStub).inOrder.to.have.been.calledWithExactly(expectedContext, expectedGitDiffFileList[0], sinon.match.func)
        .subsequently.calledWithExactly(expectedContext, expectedGitDiffFileList[1], sinon.match.func)
        .subsequently.calledWithExactly(expectedContext, expectedGitDiffFileList[2], sinon.match.func)
        .subsequently.calledWithExactly(expectedContext, expectedGitDiffFileList[3], sinon.match.func)
        .subsequently.calledWithExactly(expectedContext, expectedGitDiffFileList[4], sinon.match.func)
        .subsequently.calledWithExactly(expectedContext, expectedGitDiffFileList[5], sinon.match.func);

      sinon.assert.callCount(processUpdatedStub, 6);
      expect(processUpdatedStub).inOrder
        .to.have.been.calledWithExactly(sinon.match(expectedMetaDataForUpdate), sinon.match(expectedDataDiff), sinon.match.object, sinon.match.func)
        .subsequently.calledWithExactly(sinon.match(expectedMetaDataForUpdate), sinon.match(expectedEmptyDataDiff), sinon.match.object, sinon.match.func)
        .subsequently.calledWithExactly(sinon.match(expectedMetaDataForUpdate), sinon.match(expectedEmptyDataDiff), sinon.match.object, sinon.match.func)
        .subsequently.calledWithExactly(sinon.match(expectedMetaDataForUpdate), sinon.match(expectedEmptyDataDiff), sinon.match.object, sinon.match.func)
        .subsequently.calledWithExactly(sinon.match(expectedMetaDataForUpdate), sinon.match(expectedEmptyDataDiff), sinon.match.object, sinon.match.func)
        .subsequently.calledWithExactly(sinon.match(expectedMetaDataForUpdate), sinon.match(expectedEmptyDataDiff), sinon.match.object, sinon.match.func);

      sinon.assert.calledOnce(stopStub);
      sinon.assert.calledWithExactly(stopStub);
      sinon.assert.calledOnce(successStub);
      sinon.assert.calledWithExactly(successStub, '* Diff generation completed!');

      return done();
    });
  }));
});