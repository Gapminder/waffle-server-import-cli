'use strict';

const _ = require('lodash');
const path = require('path');
const hi = require('highland');
const fs = require('fs');
const ddfValidation = require('ddf-validation');
const JSONStream = require('JSONStream');
const proxyquire = require('proxyquire');
const {reposService} = require('waffle-server-repo-service');

const sinon = require('sinon');
const assert = sinon.assert;
const match = sinon.match;
const sinonTest = require('sinon-test');
sinon.test = sinonTest.configureTest(sinon);
sinon.testCase = sinonTest.configureTestCase(sinon);

const chai = require('chai');
const expect = chai.expect;

const sinonChai = require('sinon-chai');
const sinonChaiInOrder = require('sinon-chai-in-order');
chai.use(sinonChai);
chai.use(sinonChaiInOrder.default);

const cliUi = require('../../../service/cli-ui');
const utils = require('../../../service/git-flow-utils');

describe('Git flow utils', function () {
  describe('#updateRepoState', function () {
    it('should update repo state without errors', sinon.test(function (done) {
      // *** Arrange
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const externalContext = {github, absolutePathToRepos, relativePathToRepo, pathToRepo, githubUrlDescriptor: {branch, url}};

      const cliUiStub = this.stub(cliUi, 'state');
      const checkSshKeyStub = this.stub(reposService, 'checkSshKey').callsArgWithAsync(1);
      const silentCloneStub = this.stub(reposService, 'silentClone').callsArgWithAsync(1);
      const fetchStub = this.stub(reposService, 'fetch').callsArgWithAsync(1);
      const resetStub = this.stub(reposService, 'reset').callsArgWithAsync(1);
      const checkoutToBranchStub = this.stub(reposService, 'checkoutToBranch').callsArgWithAsync(1);
      const pullStub = this.stub(reposService, 'pull').callsArgWithAsync(1);
      const cleanStub = this.stub(reposService, 'clean').callsArgWithAsync(1);
      const checkoutToCommitStub = this.stub(reposService, 'checkoutToCommit').callsArgWithAsync(1);

      // *** Act
      return utils.updateRepoState(externalContext, (error, result) => {
        // *** Assert
        expect(error).to.not.exist;
        expect(result).to.be.equal(externalContext);

        assert.calledOnce(checkSshKeyStub);
        assert.calledWithExactly(checkSshKeyStub, match({silent: true}), match.func);

        assert.calledOnce(silentCloneStub);
        assert.calledWithExactly(silentCloneStub, match({absolutePathToRepos, relativePathToRepo, githubUrl: url, branch}), match.func);

        assert.calledOnce(fetchStub);
        assert.calledWithExactly(fetchStub, match({pathToRepo, branch}), match.func);

        assert.calledOnce(resetStub);
        assert.calledWithExactly(resetStub, match({pathToRepo, branch}), match.func);

        assert.calledOnce(checkoutToBranchStub);
        assert.calledWithExactly(resetStub, match({pathToRepo, branch}), match.func);

        assert.calledOnce(pullStub);
        assert.calledWithExactly(resetStub, match({pathToRepo, branch}), match.func);

        assert.calledOnce(cleanStub);
        assert.calledWithExactly(resetStub, match({pathToRepo, branch}), match.func);

        assert.calledOnce(checkoutToCommitStub);
        assert.calledWithExactly(resetStub, match({pathToRepo, branch}), match.func);

        assert.calledTwice(cliUiStub);
        expect(cliUiStub).inOrder
          .to.have.been.calledWithExactly('ssh, check ssh-key')
          .subsequently.calledWithExactly('git, clone repo if it doesn\'t exist');

        return done();
      });
    }));

    it('should get an error, when ssh key wasn\'t added to github keys', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedCode = 2;
      const expectedStderr = 'Some text';

      const errorDescription = 'Please, follow the detailed instruction \'https://github.com/Gapminder/waffle-server-import-cli#ssh-key\' for continue working with CLI tool.';
      const actualError = [expectedCode, expectedStderr, errorDescription].join('\n');
      const expectedError = `${cliUi.CONST_FONT_RED}* [code=${expectedCode}] ERROR: ${cliUi.CONST_FONT_YELLOW}${expectedStderr}${cliUi.CONST_FONT_BLUE}\n\t${errorDescription}${cliUi.CONST_FONT_WHITE}`;
      const externalContext = {github, pathToRepo, githubUrlDescriptor: {branch, url}};

      const cliUiStub = this.stub(cliUi, 'state');
      const checkSshKeyStub = this.stub(reposService, 'checkSshKey').callsArgWithAsync(1, actualError);
      const silentCloneStub = this.stub(reposService, 'silentClone').callsArgWithAsync(1);
      const fetchStub = this.stub(reposService, 'fetch').callsArgWithAsync(1);
      const resetStub = this.stub(reposService, 'reset').callsArgWithAsync(1);
      const checkoutToBranchStub = this.stub(reposService, 'checkoutToBranch').callsArgWithAsync(1);
      const pullStub = this.stub(reposService, 'pull').callsArgWithAsync(1);
      const cleanStub = this.stub(reposService, 'clean').callsArgWithAsync(1);
      const checkoutToCommitStub = this.stub(reposService, 'checkoutToCommit').callsArgWithAsync(1);

      return utils.updateRepoState(externalContext, (error, result) => {
        expect(error).to.be.equal(expectedError);
        expect(result).to.be.equal(externalContext);

        assert.calledOnce(checkSshKeyStub);
        assert.calledWithExactly(checkSshKeyStub, match({silent: true}), match.func);

        assert.calledOnce(cliUiStub);
        assert.calledWithExactly(cliUiStub, 'ssh, check ssh-key');

        assert.notCalled(silentCloneStub);
        assert.notCalled(fetchStub);
        assert.notCalled(resetStub);
        assert.notCalled(checkoutToBranchStub);
        assert.notCalled(pullStub);
        assert.notCalled(cleanStub);
        assert.notCalled(checkoutToCommitStub);

        return done();
      });
    }));

    it('should get an error, when error happens during cloning process', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const externalContext = {github, pathToRepo, githubUrlDescriptor: {branch, url}};

      const expectedError = 'Boo!';

      const cliUiStub = this.stub(cliUi, 'state');
      const checkSshKeyStub = this.stub(reposService, 'checkSshKey').callsArgWithAsync(1);
      const silentCloneStub = this.stub(reposService, 'silentClone').callsArgWithAsync(1, expectedError);
      const fetchStub = this.stub(reposService, 'fetch').callsArgWithAsync(1);
      const resetStub = this.stub(reposService, 'reset').callsArgWithAsync(1);
      const checkoutToBranchStub = this.stub(reposService, 'checkoutToBranch').callsArgWithAsync(1);
      const pullStub = this.stub(reposService, 'pull').callsArgWithAsync(1);
      const cleanStub = this.stub(reposService, 'clean').callsArgWithAsync(1);
      const checkoutToCommitStub = this.stub(reposService, 'checkoutToCommit').callsArgWithAsync(1);


      return utils.updateRepoState(externalContext, (error, result) => {
        expect(error).to.be.equal(expectedError);
        expect(result).to.be.equal(externalContext);

        assert.calledOnce(checkSshKeyStub);
        assert.calledWithExactly(checkSshKeyStub, {silent: true}, match.func);

        assert.calledOnce(silentCloneStub);
        assert.calledWithExactly(silentCloneStub, match.object, match.func);

        assert.notCalled(fetchStub);
        assert.notCalled(resetStub);
        assert.notCalled(checkoutToBranchStub);
        assert.notCalled(pullStub);
        assert.notCalled(cleanStub);
        assert.notCalled(checkoutToCommitStub);

        assert.calledTwice(cliUiStub);
        expect(cliUiStub).inOrder
          .to.have.been.calledWithExactly('ssh, check ssh-key')
          .subsequently.calledWithExactly('git, clone repo if it doesn\'t exist');

        return done();
      });
    }));

    it('should get an error, when error happens during fetching updates process', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const externalContext = {absolutePathToRepos, relativePathToRepo, pathToRepo, github, githubUrlDescriptor: {branch, url}};

      const expectedError = 'Boo!';

      const cliUiStub = this.stub(cliUi, 'state');
      const checkSshKeyStub = this.stub(reposService, 'checkSshKey').callsArgWithAsync(1);
      const silentCloneStub = this.stub(reposService, 'silentClone').callsArgWithAsync(1);
      const fetchStub = this.stub(reposService, 'fetch').callsArgWithAsync(1, expectedError);
      const resetStub = this.stub(reposService, 'reset').callsArgWithAsync(1);
      const checkoutToBranchStub = this.stub(reposService, 'checkoutToBranch').callsArgWithAsync(1);
      const pullStub = this.stub(reposService, 'pull').callsArgWithAsync(1);
      const cleanStub = this.stub(reposService, 'clean').callsArgWithAsync(1);
      const checkoutToCommitStub = this.stub(reposService, 'checkoutToCommit').callsArgWithAsync(1);

      return utils.updateRepoState(externalContext, (error) => {
        expect(error).to.be.equal(expectedError);

        assert.calledOnce(checkSshKeyStub);
        assert.calledWithExactly(checkSshKeyStub, match({silent: true}), match.func);

        assert.calledOnce(silentCloneStub);
        assert.calledWithExactly(silentCloneStub, match({absolutePathToRepos, relativePathToRepo, githubUrl: url, branch}), match.func);

        assert.calledOnce(fetchStub);
        assert.calledWithExactly(fetchStub, match({pathToRepo, branch}), match.func);

        assert.notCalled(resetStub);
        assert.notCalled(checkoutToBranchStub);
        assert.notCalled(pullStub);
        assert.notCalled(cleanStub);
        assert.notCalled(checkoutToCommitStub);

        assert.callCount(cliUiStub, 2);
        expect(cliUiStub).inOrder
          .to.have.been.calledWithExactly('ssh, check ssh-key')
          .subsequently.calledWithExactly('git, clone repo if it doesn\'t exist');

        return done();
      });
    }));

    it('should get an error, when error happens during reset changes process', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const externalContext = {absolutePathToRepos, relativePathToRepo, pathToRepo, github, githubUrlDescriptor: {branch, url}};

      const expectedError = 'Boo!';

      const cliUiStub = this.stub(cliUi, 'state');
      const checkSshKeyStub = this.stub(reposService, 'checkSshKey').callsArgWithAsync(1);
      const silentCloneStub = this.stub(reposService, 'silentClone').callsArgWithAsync(1);
      const fetchStub = this.stub(reposService, 'fetch').callsArgWithAsync(1);
      const resetStub = this.stub(reposService, 'reset').callsArgWithAsync(1, expectedError);
      const checkoutToBranchStub = this.stub(reposService, 'checkoutToBranch').callsArgWithAsync(1);
      const pullStub = this.stub(reposService, 'pull').callsArgWithAsync(1);
      const cleanStub = this.stub(reposService, 'clean').callsArgWithAsync(1);
      const checkoutToCommitStub = this.stub(reposService, 'checkoutToCommit').callsArgWithAsync(1);

      return utils.updateRepoState(externalContext, (error) => {
        expect(error).to.be.equal(expectedError);

        assert.calledOnce(checkSshKeyStub);
        assert.calledWithExactly(checkSshKeyStub, match({silent: true}), match.func);

        assert.calledOnce(silentCloneStub);
        assert.calledWithExactly(silentCloneStub, match({absolutePathToRepos, relativePathToRepo, githubUrl: url, branch}), match.func);

        assert.calledOnce(fetchStub);
        assert.calledWithExactly(fetchStub, match({pathToRepo, branch}), match.func);

        assert.calledOnce(resetStub);
        assert.calledWithExactly(resetStub, match({pathToRepo, branch}), match.func);

        assert.notCalled(checkoutToBranchStub);
        assert.notCalled(pullStub);
        assert.notCalled(cleanStub);
        assert.notCalled(checkoutToCommitStub);

        assert.callCount(cliUiStub, 2);
        expect(cliUiStub).inOrder
          .to.have.been.calledWithExactly('ssh, check ssh-key')
          .subsequently.calledWithExactly('git, clone repo if it doesn\'t exist');

        return done();
      });
    }));
  });

  it('should return detailed commits list from git log', sinon.test(function (done) {
    const branch = 'branch';
    const url = 'git@github.com:VS-work/ddf--ws-testing.git';
    const github = `${url}#${branch}`;
    const absolutePathToRepos = process.cwd();
    const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
    const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
    const externalContext = {github, pathToRepo, githubUrlDescriptor: {branch, url}};
    const expectedDate = Date.now();
    const detailedCommitsList = [
      {
        hash: '5166a22',
        message: 'Test message',
        date: expectedDate + 1
      }, {
        hash: '37f87b6',
        message: 'Test message 2',
        date: expectedDate
      }
    ];
    const logStub = this.stub(reposService, 'log').callsArgWithAsync(1, null, detailedCommitsList);

    const cliUiStub = this.stub(cliUi, 'state');
    const utils = require('../../../service/git-flow-utils');

    return utils.gitLog(externalContext, (error, result) => {
      // *** Assert
      expect(error).to.not.exist;
      expect(result).to.be.deep.equal(_.defaults({detailedCommitsList}, externalContext));

      assert.calledOnce(logStub);
      assert.calledWithExactly(logStub, match.object, match.func);

      assert.calledOnce(cliUiStub);
      assert.calledWithExactly(cliUiStub, 'git, get commits log');

      return done();
    });
  }));

  it('should return error when it happens during getting git repo log', sinon.test(function (done) {
    const branch = 'branch';
    const url = 'git@github.com:VS-work/ddf--ws-testing.git';
    const github = `${url}#${branch}`;
    const absolutePathToRepos = process.cwd();
    const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
    const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
    const externalContext = {github, pathToRepo, githubUrlDescriptor: {branch, url}};
    const expectedError = 'Boo!';

    const logStub = this.stub(reposService, 'log').callsArgWithAsync(1, expectedError, null);

    const cliUiStub = this.stub(cliUi, 'state');

    return utils.gitLog(externalContext, (error, result) => {
      // *** Assert
      expect(error).to.be.equal(expectedError);
      expect(result).to.be.deep.equal(_.defaults({detailedCommitsList: null}, externalContext));

      assert.calledOnce(logStub);
      assert.calledWithExactly(logStub, match.object, match.func);

      assert.calledOnce(cliUiStub);
      assert.calledWithExactly(cliUiStub, 'git, get commits log');

      return done();
    });
  }));

  it('should return detailed notes from git show command', sinon.test(function (done) {
    const branch = 'branch';
    const url = 'git@github.com:VS-work/ddf--ws-testing.git';
    const github = `${url}#${branch}`;
    const absolutePathToRepos = process.cwd();
    const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
    const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
    const externalContext = {github, pathToRepo, githubUrlDescriptor: {branch, url}};
    const field = 'from';
    const hash = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
    const expectedResult = {
      commit: '57a3bc8576fb3aed6b676f4bd53391c84068f866',
      Author: 'Test test Test <test@gmail.com>',
      Date: 'Mon Mar 20 13:37:43 2017 +0200'
    };
    const showStub = this.stub(reposService, 'show').callsArgWithAsync(1, null, expectedResult);

    const cliUiStub = this.stub(cliUi, 'state');
    const warnStub = this.stub(console, 'warn');

    return utils.gitShow(field, hash, externalContext, (error, result) => {
      // *** Assert
      expect(error).to.not.exist;
      expect(result).to.be.deep.equal(_.defaults({[field]: expectedResult}, externalContext));

      assert.notCalled(warnStub);

      assert.calledOnce(showStub);
      assert.calledWithExactly(showStub, match.object, match.func);

      assert.calledOnce(cliUiStub);
      assert.calledWithExactly(cliUiStub, 'git, get repo notes');

      return done();
    });
  }));

  it('should return empty string as a result when error happens during getting git repo notes', sinon.test(function (done) {
    const branch = 'branch';
    const url = 'git@github.com:VS-work/ddf--ws-testing.git';
    const github = `${url}#${branch}`;
    const absolutePathToRepos = process.cwd();
    const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
    const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
    const externalContext = {github, pathToRepo, githubUrlDescriptor: {branch, url}};
    const field = 'to';
    const hash = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
    const expectedResult = {
      commit: '57a3bc8576fb3aed6b676f4bd53391c84068f866',
      Author: 'Test test Test <test@gmail.com>',
      Date: 'Mon Mar 20 13:37:43 2017 +0200'
    };
    const expectedError = 'does not exist in';
    const showStub = this.stub(reposService, 'show').callsArgWithAsync(1, expectedError, expectedResult);

    const cliUiStub = this.stub(cliUi, 'state');

    return utils.gitShow(field, hash, externalContext, (error, result) => {
      // *** Assert
      expect(error).to.not.exist;
      expect(result).to.be.deep.equal(_.defaults({[field]: ''}, externalContext));

      assert.calledOnce(showStub);
      assert.calledWithExactly(showStub, match.object, match.func);

      assert.calledOnce(cliUiStub);
      assert.calledWithExactly(cliUiStub, 'git, get repo notes');

      return done();
    });
  }));

  describe('#getFileStatusesDiff', function() {
    it('should return empty list of file name diffs from git diff command', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const commitFrom = '66a50bb25be90d69a94a3904611363ee20a87848';
      const commitTo = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
      const externalContext = {hashFrom: commitFrom, pathToRepo, hashTo: commitTo};
      const expectedResult = {};
      const diffStub = this.stub(reposService, 'diff').callsArgWithAsync(1, null, expectedResult);

      const cliUiStub = this.stub(cliUi, 'state');

      return utils.getFileStatusesDiff(externalContext, (error, result) => {
        // *** Assert
        expect(error).to.not.exist;
        expect(result).to.be.deep.equal(_.defaults({gitDiffFileStatus: {}}, externalContext));

        assert.calledOnce(diffStub);
        assert.calledWithExactly(diffStub, match({commitFrom, commitTo}), match.func);

        assert.calledOnce(cliUiStub);
        assert.calledWithExactly(cliUiStub, 'git, get diff file names with states');

        return done();
      });
    }));

    it('should return list of files status diffs from git diff command', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const commitFrom = '66a50bb25be90d69a94a3904611363ee20a87848';
      const commitTo = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
      const externalContext = {hashFrom: commitFrom, pathToRepo, hashTo: commitTo};
      const expectedResult = {
        'ddf--concepts.csv': 'M',
        'ddf--datapoints--company_scale--by--company--anno.csv': 'A',
        'ddf--entities--company--company_scale.csv': 'M',
        'ddf--entities--company.csv': 'D',
        'lang/nl-nl/ddf--concepts.csv': 'A',
        'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv': 'A',
      };
      const diffStub = this.stub(reposService, 'diff').callsArgWithAsync(1, null, expectedResult);

      const cliUiStub = this.stub(cliUi, 'state');

      return utils.getFileStatusesDiff(externalContext, (error, result) => {
        // *** Assert
        expect(error).to.not.exist;
        expect(result).to.be.deep.equal(_.defaults({gitDiffFileStatus: {
          'ddf--concepts.csv': 'M',
          'ddf--datapoints--company_scale--by--company--anno.csv': 'A',
          'ddf--entities--company--company_scale.csv': 'M',
          'ddf--entities--company.csv': 'D',
          'lang/nl-nl/ddf--concepts.csv': 'A',
          'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv': 'A',
        }}, externalContext));

        assert.calledOnce(diffStub);
        assert.calledWithExactly(diffStub, match({commitFrom, commitTo}), match.func);

        assert.calledOnce(cliUiStub);
        assert.calledWithExactly(cliUiStub, 'git, get diff file names with states');

        return done();
      });
    }));

    it('should return error when it happens during git diff files status command', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const commitFrom = '66a50bb25be90d69a94a3904611363ee20a87848';
      const commitTo = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
      const externalContext = {hashFrom: commitFrom, pathToRepo, hashTo: commitTo};
      const expectedResult = {
        'ddf--concepts.csv': 'M',
        'ddf--datapoints--company_scale--by--company--anno.csv': 'A',
        'ddf--entities--company--company_scale.csv': 'M',
        'ddf--entities--company.csv': 'D',
        'lang/nl-nl/ddf--concepts.csv': 'A',
        'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv': 'A',
      };
      const expectedError = 'Boo!';
      const diffStub = this.stub(reposService, 'diff').callsArgWithAsync(1, expectedError, expectedResult);

      const cliUiStub = this.stub(cliUi, 'state');

      return utils.getFileStatusesDiff(externalContext, (error, result) => {
        // *** Assert
        expect(error).to.be.equal(expectedError);
        expect(result).to.be.deep.equal(_.defaults({gitDiffFileStatus: {
          'ddf--concepts.csv': 'M',
          'ddf--datapoints--company_scale--by--company--anno.csv': 'A',
          'ddf--entities--company--company_scale.csv': 'M',
          'ddf--entities--company.csv': 'D',
          'lang/nl-nl/ddf--concepts.csv': 'A',
          'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv': 'A',
        }}, externalContext));

        assert.calledOnce(diffStub);
        assert.calledWithExactly(diffStub, match({commitFrom, commitTo}), match.func);

        assert.calledOnce(cliUiStub);
        assert.calledWithExactly(cliUiStub, 'git, get diff file names with states');

        return done();
      });
    }));
  });

  it('should checkout to certain hash without error', sinon.test(function (done) {
    const absolutePathToRepos = process.cwd();
    const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
    const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
    const externalContext = {pathToRepo};
    const hash = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
    const checkoutToCommitStub = this.stub(reposService, 'checkoutToCommit').callsArgWithAsync(1);

    const cliUiStub = this.stub(cliUi, 'state');

    return utils.checkoutHash(hash, externalContext, (error, result) => {
      // *** Assert
      expect(error).to.not.exist;
      expect(result).to.be.deep.equal(externalContext);

      assert.calledOnce(checkoutToCommitStub);
      assert.calledWithExactly(checkoutToCommitStub, match({commit: hash}), match.func);

      assert.calledOnce(cliUiStub);
      assert.calledWithExactly(cliUiStub, `git, checkout to '${hash}'`);

      return done();
    });
  }));

  it('should return error when it happens during git checkout command', sinon.test(function (done) {
    const absolutePathToRepos = process.cwd();
    const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
    const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
    const externalContext = {pathToRepo};
    const hash = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
    const expectedError = 'Boo!';

    const checkoutToCommitStub = this.stub(reposService, 'checkoutToCommit').callsArgWithAsync(1, expectedError);

    const cliUiStub = this.stub(cliUi, 'state');

    return utils.checkoutHash(hash, externalContext, (error, result) => {
      // *** Assert
      expect(error).to.be.equal(expectedError);
      expect(result).to.equal(externalContext);

      assert.calledOnce(checkoutToCommitStub);
      assert.calledWithExactly(checkoutToCommitStub, match({commit: hash}), match.func);

      assert.calledOnce(cliUiStub);
      assert.calledWithExactly(cliUiStub, `git, checkout to '${hash}'`);

      return done();
    });
  }));

  describe('#validateDataset', function() {
    it('should validate dataset without error', sinon.test(function (done) {
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const issue = {description: 'Error'};

      const successStub = this.stub(cliUi, 'success');
      const stopStub = this.stub(cliUi, 'stop').returns({success: successStub});
      const streamValidatorStub = sinon.createStubInstance(ddfValidation.StreamValidator);

      streamValidatorStub.validate.callsFake(() => {
        streamValidatorStub.emit('finish', null);
      });
      streamValidatorStub.emit = this.stub()
        .callsFake((eventName, ...args) => {
          streamValidatorStub[eventName](...args);
        });
      streamValidatorStub.on.callsFake((task, callback) => {
        streamValidatorStub[task] = callback;
      });

     const utils = proxyquire('../../../service/git-flow-utils', {
        'ddf-validation': {
          StreamValidator: this.stub().returns(streamValidatorStub)
        }
      });

      return utils.validateDataset({pathToRepo}, (error) => {
        expect(error).to.not.exist;

        assert.calledOnce(streamValidatorStub.validate);
        assert.calledOnce(streamValidatorStub.emit);
        assert.calledThrice(streamValidatorStub.on);
        assert.calledTwice(stopStub);
        assert.calledWithExactly(stopStub);
        assert.calledOnce(successStub);
        assert.calledWithExactly(successStub, '* Validation completed!');

        assert.callOrder(
          streamValidatorStub.on,
          streamValidatorStub.validate,
          streamValidatorStub.emit,
          stopStub,
          successStub
        );

        return done();
      })
    }));

    it('should validate dataset with one issue', sinon.test(function (done) {
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const issue = {description: 'Error'};

      const errorStub = this.stub(cliUi, 'error');
      const stopStub = this.stub(cliUi, 'stop').returns({error: errorStub});
      const streamValidatorStub = sinon.createStubInstance(ddfValidation.StreamValidator);

      streamValidatorStub.validate.callsFake(() => {
        streamValidatorStub.emit('issue', issue);
        streamValidatorStub.emit('finish', null);
      });
      streamValidatorStub.emit = this.stub()
        .callsFake((eventName, ...args) => {
          streamValidatorStub[eventName](...args);
        });
      streamValidatorStub.on.callsFake((task, callback) => {
        streamValidatorStub[task] = callback;
      });

      const utils = proxyquire('../../../service/git-flow-utils', {
        'ddf-validation': {
          StreamValidator: this.stub().returns(streamValidatorStub)
        }
      });

      return utils.validateDataset({pathToRepo}, (error) => {
        expect(error).to.be.deep.equal([JSON.stringify(issue, null, 2)]);

        assert.calledOnce(streamValidatorStub.validate);
        assert.calledTwice(streamValidatorStub.emit);
        assert.calledThrice(streamValidatorStub.on);
        assert.calledTwice(stopStub);
        assert.calledWithExactly(stopStub);
        assert.calledOnce(errorStub);
        assert.calledWithExactly(errorStub, '* Validation Error!');

        assert.callOrder(
          streamValidatorStub.on,
          streamValidatorStub.validate,
          streamValidatorStub.emit,
          stopStub,
          errorStub
        );

        return done();
      })
    }));

    it('should validate dataset with error from validator, without issue', sinon.test(function (done) {
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedError = 'Boo!';

      const errorStub = this.stub(cliUi, 'error');
      const stopStub = this.stub(cliUi, 'stop').returns({error: errorStub});
      const streamValidatorStub = sinon.createStubInstance(ddfValidation.StreamValidator);

      streamValidatorStub.validate.callsFake(() => {
        streamValidatorStub.emit('finish', expectedError);
      });
      streamValidatorStub.emit = this.stub()
        .callsFake((eventName, ...args) => {
          streamValidatorStub[eventName](...args);
        });
      streamValidatorStub.on.callsFake((task, callback) => {
        streamValidatorStub[task] = callback;
      });

      const utils = proxyquire('../../../service/git-flow-utils', {
        'ddf-validation': {
          StreamValidator: this.stub().returns(streamValidatorStub)
        }
      });

      return utils.validateDataset({pathToRepo}, (error) => {
        expect(error).to.be.equal(expectedError);

        assert.calledOnce(streamValidatorStub.validate);
        assert.calledOnce(streamValidatorStub.emit);
        assert.calledThrice(streamValidatorStub.on);
        assert.calledTwice(stopStub);
        assert.calledWithExactly(stopStub);
        assert.calledOnce(errorStub);
        assert.calledWithExactly(errorStub, `* Validation Error: ${expectedError}`);

        assert.callOrder(
          streamValidatorStub.on,
          streamValidatorStub.validate,
          streamValidatorStub.emit,
          stopStub,
          errorStub
        );

        return done();
      })
    }));
  });

  it('should create an json stream for getting data from json file', sinon.test(function () {
    // *** Arrange
    const pathToFile = path.resolve('./repos/test') + '/datapackage.json';

    const fsStub = this.stub(fs, 'createReadStream').returns(hi());
    const JSONStreamStub = this.stub(JSONStream, 'parse').returns(hi());

    // *** Act
    const jsonStream = utils.readJsonFileAsJsonStream(pathToFile);

    // *** Assert
    expect(hi.isStream(jsonStream)).to.be.true;
    assert.calledOnce(fsStub);
    assert.calledWithExactly(fsStub, pathToFile, {encoding: 'utf8'});
    assert.calledOnce(JSONStreamStub);
    assert.calledWithExactly(JSONStreamStub);
  }));

  describe('#getDatapackage', function() {
    it('should get all data from datapackage file', sinon.test(function (done) {
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const externalContext = {pathToRepo, metadata: {}};
      const propertyName = 'old';
      const datapackage = require('./fixtures/datapackage.json');

      const existsSyncStub = this.stub(fs, 'existsSync').returns(true);
      const createReadStreamStub = this.stub(fs, 'createReadStream').returns(hi());
      const JSONStreamStub = this.stub(JSONStream, 'parse').returns(hi([datapackage]));

      const expectedDatapackagePath = `${pathToRepo}datapackage.json`;

      return utils.getDatapackage(propertyName, externalContext, (error, context) => {
        expect(error).to.not.exist;
        expect(context).to.be.deep.equal(_.defaults({metadata: {[propertyName]: datapackage}}, externalContext));

        assert.calledOnce(existsSyncStub);
        assert.calledWithExactly(existsSyncStub, expectedDatapackagePath);

        assert.calledOnce(createReadStreamStub);
        assert.calledWithExactly(createReadStreamStub, expectedDatapackagePath, {encoding: 'utf8'});

        assert.calledOnce(JSONStreamStub);
        assert.calledWithExactly(JSONStreamStub);

        return done();
      });
    }));

    it('should get error if file doesn\'t exist', sinon.test(function (done) {
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const externalContext = {pathToRepo, metadata: {}};
      const propertyName = 'old';
      const datapackage = require('./fixtures/datapackage.json');

      const existsSyncStub = this.stub(fs, 'existsSync').returns(false);
      const createReadStreamStub = this.stub(fs, 'createReadStream').returns(hi());
      const JSONStreamStub = this.stub(JSONStream, 'parse').returns(hi());

      const expectedDatapackagePath = `${pathToRepo}datapackage.json`;

      return utils.getDatapackage(propertyName, externalContext, (error, context) => {
        expect(error).to.be.equal('`datapackage.json` is absent');
        expect(context).to.not.exist;

        assert.calledOnce(existsSyncStub);
        assert.calledWithExactly(existsSyncStub, expectedDatapackagePath);

        assert.notCalled(createReadStreamStub);
        assert.notCalled(JSONStreamStub);

        return done();
      });
    }));

    it('should get error if it happens during reading stream', sinon.test(function (done) {
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const externalContext = {pathToRepo, metadata: {}};
      const propertyName = 'old';
      const datapackage = require('./fixtures/datapackage.json');
      const expectedError = new Error('Boo!');

      const existsSyncStub = this.stub(fs, 'existsSync').returns(true);
      const createReadStreamStub = this.stub(fs, 'createReadStream').returns(hi());
      const JSONStreamStub = this.stub(JSONStream, 'parse').returns(hi.fromError(expectedError));

      const expectedDatapackagePath = `${pathToRepo}datapackage.json`;

      return utils.getDatapackage(propertyName, externalContext, (error, context) => {
        expect(error).to.be.equal(expectedError);
        expect(context).to.not.exist;

        assert.calledOnce(existsSyncStub);
        assert.calledWithExactly(existsSyncStub, expectedDatapackagePath);

        assert.calledOnce(createReadStreamStub);
        assert.calledWithExactly(createReadStreamStub, expectedDatapackagePath, {encoding: 'utf8'});

        assert.calledOnce(JSONStreamStub);
        assert.calledWithExactly(JSONStreamStub);

        return done();
      });
    }));
  });
});