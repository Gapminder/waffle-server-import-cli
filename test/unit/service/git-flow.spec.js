'use strict';

const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const proxyquire = require('proxyquire');

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

const envConst = require('../../../model/env-const');
const utils = require('../../../service/git-flow-utils');
const cliUi = require('../../../service/cli-ui');
const repoService = require('waffle-server-repo-service').default;

describe('Service: Git flow', function () {
  describe('simple functionc', () => {
    it('should get short hash, when given hash is valid', sinon.test(function () {
      const gitFlow = require('../../../service/git-flow');
      const hash = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
      const actualShortenedHash = gitFlow.getShortHash(hash);

      expect(actualShortenedHash).to.be.equal('5166a22');
    }));

    it('should get empty value, when given hash is invalid', sinon.test(function () {
      const gitFlow = require('../../../service/git-flow');

      const actualShortenedHash = gitFlow.getShortHash();

      expect(actualShortenedHash).to.be.equal('');
    }));

    it('should get absolute path to the repository', sinon.test(function (done) {
      const giturl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const gitFlow = require('../../../service/git-flow');
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(relativePathToRepo);
      const expectedConfigDir = {pathToRepo: pathToRepo + '/', absolutePathToRepos, relativePathToRepo};
      const getRepoFolderStub = this.stub(gitFlow, 'getRepoFolder').callsArgWithAsync(1, null, expectedConfigDir);

      gitFlow.configDir(giturl, (error, configDir) => {
        expect(configDir).to.equal(expectedConfigDir);

        assert.calledOnce(getRepoFolderStub);
        assert.calledWithExactly(getRepoFolderStub, giturl, match.func);

        return done();
      });
    }));

    it('should get error, when it happens while getting repo folder', sinon.test(function (done) {
      const giturl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const gitFlow = require('../../../service/git-flow');
      const expectedError = new Error('Unexpected error');
      const getRepoFolderStub = this.stub(gitFlow, 'getRepoFolder').callsArgWithAsync(1, expectedError);

      gitFlow.configDir(giturl, (error) => {
        expect(error).to.be.deep.equal(expectedError);

        assert.calledOnce(getRepoFolderStub);
        assert.calledWithExactly(getRepoFolderStub, giturl, match.func);

        return done();
      })
    }));

    it('should get empty repo name, when account is absent in giturl', () => {
      const giturl = 'git@github.com:/ddf--ws-testing.git';
      const gitFlow = require('../../../service/git-flow');

      const repoName = gitFlow.getRepoName(giturl);

      expect(repoName).to.be.equal('');
    });

    it('should get empty repo name, when repo name is absent in giturl', () => {
      const giturl = 'git@github.com:VS-work/';
      const gitFlow = require('../../../service/git-flow');

      const repoName = gitFlow.getRepoName(giturl);

      expect(repoName).to.be.equal('');
    });

    it('should get repo name without branch name, when branch was not set in giturl', () => {
      const giturl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const gitFlow = require('../../../service/git-flow');

      const repoName = gitFlow.getRepoName(giturl);

      expect(repoName).to.be.equal('VS-work/ddf--ws-testing');
    });

    it('should get repo name without branch name, when branch master was set in giturl', () => {
      const giturl = 'git@github.com:VS-work/ddf--ws-testing.git#master';
      const gitFlow = require('../../../service/git-flow');

      const repoName = gitFlow.getRepoName(giturl);

      expect(repoName).to.be.equal('VS-work/ddf--ws-testing');
    });

    it('should get repo name with branch name, when branch was set in giturl', () => {
      const giturl = 'git@github.com:VS-work/ddf--ws-testing.git#branch';
      const gitFlow = require('../../../service/git-flow');

      const repoName = gitFlow.getRepoName(giturl);

      expect(repoName).to.be.equal('VS-work/ddf--ws-testing#branch');
    });

    it('should get empty repo path, when account wasn\'t specified in giturl', () => {
      const giturl = 'git@github.com:/ddf--ws-testing.git';
      const gitFlow = require('../../../service/git-flow');

      const repoName = gitFlow.getRepoPath(giturl);

      expect(repoName).to.be.equal('');
    });

    it('should get empty repo path, when repo wasn\'t specified in giturl', () => {
      const giturl = 'git@github.com:VS-work/';
      const gitFlow = require('../../../service/git-flow');

      const repoName = gitFlow.getRepoPath(giturl);

      expect(repoName).to.be.equal('');
    });

    it('should get full repo path, when account and repo were specified in giturl', () => {
      const giturl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const gitFlow = require('../../../service/git-flow');

      const repoName = gitFlow.getRepoPath(giturl);

      expect(repoName).to.be.equal('VS-work/ddf--ws-testing/master');
    });

    it('should get full repo path, when account, repo and master branch were specified in giturl', () => {
      const giturl = 'git@github.com:VS-work/ddf--ws-testing.git#master';
      const gitFlow = require('../../../service/git-flow');

      const repoName = gitFlow.getRepoPath(giturl);

      expect(repoName).to.be.equal('VS-work/ddf--ws-testing/master');
    });

    it('should get full repo path, when account, repo and some branch were specified in giturl', () => {
      const giturl = 'git@github.com:VS-work/ddf--ws-testing.git#branch';
      const gitFlow = require('../../../service/git-flow');

      const repoName = gitFlow.getRepoPath(giturl);

      expect(repoName).to.be.equal('VS-work/ddf--ws-testing/branch');
    });

    it('should get absolute path to the repository, if it was already created', sinon.test(function (done) {
      const giturl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const gitFlow = require('../../../service/git-flow');
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(relativePathToRepo);
      const expectedConfigDir = {pathToRepo: pathToRepo + '/', absolutePathToRepos, relativePathToRepo};

      this.stub(envConst, 'PATH_REPOS', absolutePathToRepos);

      const getRepoPathStub = this.stub(gitFlow, 'getRepoPath').returns(relativePathToRepo);
      const makeDirForceStub = this.stub(repoService, 'makeDirForce').callsArgWithAsync(1);

      gitFlow.getRepoFolder(giturl, (error, configDir) => {
        expect(configDir).to.eql(expectedConfigDir);

        assert.calledOnce(getRepoPathStub);
        assert.calledWithExactly(getRepoPathStub, giturl);

        assert.calledOnce(makeDirForceStub);
        assert.calledWithExactly(makeDirForceStub, {pathToDir: pathToRepo}, match.func);

        return done();
      });
    }));

     it('should get error, when it happens while creating repo folder', sinon.test(function (done) {
      const giturl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const gitFlow = require('../../../service/git-flow');

      const expectedError = `Something went wrong during creation directory process`;
       const absolutePathToRepos = process.cwd();
       const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
       const pathToRepo = path.resolve(relativePathToRepo);
       const expectedConfigDir = {pathToRepo: pathToRepo + '/', absolutePathToRepos, relativePathToRepo};

      this.stub(envConst, 'PATH_REPOS', absolutePathToRepos);

      const getRepoPathStub = this.stub(gitFlow, 'getRepoPath').returns(relativePathToRepo);
      const makeDirForceStub = this.stub(repoService, 'makeDirForce').callsArgWithAsync(1, expectedError);

      gitFlow.getRepoFolder(giturl, (error) => {
        expect(error).to.be.deep.equal(expectedError);

        assert.calledOnce(getRepoPathStub);
        assert.calledWithExactly(getRepoPathStub, giturl);

        assert.calledOnce(makeDirForceStub);
        assert.calledWithExactly(makeDirForceStub, {pathToDir: pathToRepo}, match.func);

        return done();
      });
    }));
  });

  describe('#registerRepo', function () {
    it('should register repo without errors', sinon.test(function (done) {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const branchName = 'branch';
      const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const githubUrl = `${repoUrl}#${branchName}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedConfigDir = {pathToRepo, relativePathToRepo, absolutePathToRepos};
      const expectedContext = {
        branch: branchName,
        url: repoUrl,
        pathToRepo,
        github: githubUrl,
        relativePathToRepo,
        absolutePathToRepos
      };

      const configDirStub = this.stub(gitFlow, 'configDir').callsArgWithAsync(1, null, expectedConfigDir);
      const getGithubUrlDescriptorStub = this.stub(utils, 'getGithubUrlDescriptor').returns(expectedContext);
      const updateRepoStateStub = this.stub(utils, 'updateRepoState').callsArgWithAsync(1);

      // *** Act
      return gitFlow.registerRepo(githubUrl, (error, result) => {
        // *** Assert
        expect(error).to.not.exist;
        expect(result).to.not.exist;

        assert.calledOnce(configDirStub);
        assert.calledWithExactly(configDirStub, githubUrl, match.func);

        assert.calledOnce(getGithubUrlDescriptorStub);
        assert.calledWithExactly(getGithubUrlDescriptorStub, githubUrl);

        assert.calledOnce(updateRepoStateStub);
        assert.calledWithExactly(updateRepoStateStub, expectedContext, match.func);

        assert.callOrder(configDirStub, getGithubUrlDescriptorStub, updateRepoStateStub);

        return done();
      });
    }));

    it('should return error if it happens during updating repo process', sinon.test(function (done) {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const branchName = 'branch';
      const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const githubUrl = `${repoUrl}#${branchName}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedConfigDir = {pathToRepo, relativePathToRepo, absolutePathToRepos};
      const expectedError = 'Boo!';

      const expectedContext = {
        branch: branchName,
        url: repoUrl,
        pathToRepo,
        github: githubUrl,
        relativePathToRepo,
        absolutePathToRepos
      };

      const configDirStub = this.stub(gitFlow, 'configDir').callsArgWithAsync(1, null, expectedConfigDir);
      const getGithubUrlDescriptorStub = this.stub(utils, 'getGithubUrlDescriptor').returns(expectedContext);
      const updateRepoStateStub = this.stub(utils, 'updateRepoState').callsArgWithAsync(1, expectedError);

      /// *** Act
      return gitFlow.registerRepo(githubUrl, (error, result) => {
        // *** Assert
        expect(error).to.be.equal(expectedError);
        expect(result).to.not.exist;

        assert.calledOnce(configDirStub);
        assert.calledWithExactly(configDirStub, githubUrl, match.func);

        assert.calledOnce(getGithubUrlDescriptorStub);
        assert.calledWithExactly(getGithubUrlDescriptorStub, githubUrl);

        assert.calledOnce(updateRepoStateStub);
        assert.calledWithExactly(updateRepoStateStub, expectedContext, match.func);

        assert.callOrder(configDirStub, getGithubUrlDescriptorStub, updateRepoStateStub);

        return done();
      });
    }));
  });

  describe('#getCommitList', function () {
    it('should register repo without errors', sinon.test(function (done) {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const branchName = 'branch';
      const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const githubUrl = `${repoUrl}#${branchName}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedConfigDir = {pathToRepo, relativePathToRepo, absolutePathToRepos};
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
      const expectedCommitsList = [
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

      const expectedContext = {
        branch: branchName,
        url: repoUrl,
        pathToRepo,
        github: githubUrl,
        absolutePathToRepos,
        relativePathToRepo
      };

      const configDirStub = this.stub(gitFlow, 'configDir').callsArgWithAsync(1, null, expectedConfigDir);
      const getGithubUrlDescriptorStub = this.stub(utils, 'getGithubUrlDescriptor').returns(expectedContext);
      const updateRepoStateStub = this.stub(utils, 'updateRepoState').callsArgWithAsync(1, null, expectedContext);
      const gitLogStub = this.stub(utils, 'gitLog').callsArgWithAsync(1, null, _.defaults({detailedCommitsList}, expectedContext));

      // *** Act
      return gitFlow.getCommitList(githubUrl, (error, result) => {
        // *** Assert
        expect(error).to.not.exist;
        expect(result).to.be.deep.equal(expectedCommitsList);

        assert.calledOnce(configDirStub);
        assert.calledWithExactly(configDirStub, githubUrl, match.func);

        assert.calledOnce(getGithubUrlDescriptorStub);
        assert.calledWithExactly(getGithubUrlDescriptorStub, githubUrl);

        assert.calledOnce(updateRepoStateStub);
        assert.calledWithExactly(updateRepoStateStub, expectedContext, match.func);

        assert.calledOnce(gitLogStub);
        assert.calledWithExactly(gitLogStub, expectedContext, match.func);

        assert.callOrder(getGithubUrlDescriptorStub, configDirStub, updateRepoStateStub, gitLogStub);

        return done();
      });
    }));

    it('should return error if it happens during updating repo process', sinon.test(function (done) {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const branchName = 'branch';
      const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const githubUrl = `${repoUrl}#${branchName}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedConfigDir = {pathToRepo, relativePathToRepo, absolutePathToRepos};
      const expectedError = 'Boo!';

      const expectedContext = {
        branch: branchName,
        url: repoUrl,
        pathToRepo,
        github: githubUrl,
        absolutePathToRepos,
        relativePathToRepo
      };

      const configDirStub = this.stub(gitFlow, 'configDir').callsArgWithAsync(1, null, expectedConfigDir);
      const getGithubUrlDescriptorStub = this.stub(utils, 'getGithubUrlDescriptor').returns(expectedContext);
      const updateRepoStateStub = this.stub(utils, 'updateRepoState').callsArgWithAsync(1, expectedError);
      const gitLogStub = this.stub(utils, 'gitLog').callsArgWithAsync(1);

      /// *** Act
      return gitFlow.getCommitList(githubUrl, (error, result) => {
        // *** Assert
        expect(error).to.be.equal(expectedError);
        expect(result).to.not.exist;

        assert.calledOnce(configDirStub);
        assert.calledWithExactly(configDirStub, githubUrl, match.func);

        assert.calledOnce(getGithubUrlDescriptorStub);
        assert.calledWithExactly(getGithubUrlDescriptorStub, githubUrl);

        assert.calledOnce(updateRepoStateStub);
        assert.calledWithExactly(updateRepoStateStub, expectedContext, match.func);

        assert.notCalled(gitLogStub);

        assert.callOrder(getGithubUrlDescriptorStub, configDirStub, updateRepoStateStub);

        return done();
      });
    }));

    it('should return error if it happens during updating repo process', sinon.test(function (done) {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const branchName = 'branch';
      const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const githubUrl = `${repoUrl}#${branchName}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedConfigDir = {pathToRepo, relativePathToRepo, absolutePathToRepos};
      const expectedError = 'Boo!';

      const expectedContext = {
        branch: branchName,
        url: repoUrl,
        pathToRepo,
        github: githubUrl,
        absolutePathToRepos,
        relativePathToRepo
      };

      const configDirStub = this.stub(gitFlow, 'configDir').callsArgWithAsync(1, null, expectedConfigDir);
      const getGithubUrlDescriptorStub = this.stub(utils, 'getGithubUrlDescriptor').returns(expectedContext);
      const updateRepoStateStub = this.stub(utils, 'updateRepoState').callsArgWithAsync(1, null, expectedContext);
      const gitLogStub = this.stub(utils, 'gitLog').callsArgWithAsync(1, expectedError);

      /// *** Act
      return gitFlow.getCommitList(githubUrl, (error, result) => {
        // *** Assert
        expect(error).to.be.equal(expectedError);
        expect(result).to.not.exist;

        assert.calledOnce(configDirStub);
        assert.calledWithExactly(configDirStub, githubUrl, match.func);

        assert.calledOnce(getGithubUrlDescriptorStub);
        assert.calledWithExactly(getGithubUrlDescriptorStub, githubUrl);

        assert.calledOnce(updateRepoStateStub);
        assert.calledWithExactly(updateRepoStateStub, expectedContext, match.func);

        assert.calledOnce(gitLogStub);
        assert.calledWithExactly(gitLogStub, expectedContext, match.func);

        assert.callOrder(getGithubUrlDescriptorStub, configDirStub, updateRepoStateStub, gitLogStub);

        return done();
      });
    }));
  });

  describe('#getFileDiffByHashes', () => {
    it('should get file diff by hashes', sinon.test(function (done) {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const hashFrom = 'aaaaaaa';
      const hashTo = 'bbbbbbb';
      const branchName = 'branch';
      const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const githubUrl = `${repoUrl}#${branchName}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedConfigDir = {pathToRepo, relativePathToRepo, absolutePathToRepos};

      const gitDiffFileList = [
        'ddf--concepts.csv',
        'ddf--datapoints--company_scale--by--company--anno.csv',
        'ddf--entities--company--company_scale.csv',
        'lang/nl-nl/ddf--concepts.csv',
        'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv',
        'lang/nl-nl/ddf--entities--company--company_scale.csv'
      ];

      const gitDiffFileStatus = {
        'ddf--concepts.csv': 'M',
        'ddf--datapoints--company_scale--by--company--anno.csv': 'A',
        'ddf--entities--company--company_scale.csv': 'D',
        'lang/nl-nl/ddf--concepts.csv': 'A',
        'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv': 'A',
        'lang/nl-nl/ddf--entities--company--company_scale.csv': 'A'
      };

      const metadata = {
        datapackageOld: {
          name: 'ddf--ws-testing',
          title: 'ddf--ws-testing',
          description: '',
          version: '0.0.1'
        },
        datapackageNew: {
          name: 'ddf--ws-testing2',
          title: 'ddf--ws-testing2',
          description: '',
          version: '1.0.0'
        }
      };

      const configDirStub = this.stub(gitFlow, 'configDir').callsArgWithAsync(1, null, expectedConfigDir);
      const updateRepoStateStub = this.stub(utils, 'updateRepoState').callsArgWithAsync(1, null, {});
      const getFileStatusesDiffStub = this.stub(utils, 'getFileStatusesDiff').callsArgWithAsync(1, null, {});
      const checkoutHashStub = this.stub(utils, 'checkoutHash').callsArgWithAsync(2, null, {});
      const getDatapackageStub = this.stub(utils, 'getDatapackage')
        .onFirstCall().callsArgWithAsync(2, null, {})
        .onSecondCall().callsArgWithAsync(2, null, {gitDiffFileStatus: gitDiffFileStatus, metadata});

      // *** Act
      const context = {github: githubUrl, hashFrom, hashTo, absolutePathToRepos, relativePathToRepo};

      return gitFlow.getFileDiffByHashes(context, (error, result) => {
        // *** Assert
        expect(error).to.not.exist;
        expect(result).to.be.deep.equal({gitDiffFileList, gitDiffFileStatus, metadata});

        assert.calledOnce(configDirStub);
        assert.calledWithExactly(configDirStub, githubUrl, match.func);

        assert.calledOnce(updateRepoStateStub);
        assert.calledOnce(getFileStatusesDiffStub);

        assert.calledTwice(checkoutHashStub);
        assert.calledWithExactly(checkoutHashStub, match(hashFrom).or(match(hashTo)), match.object, match.func);

        assert.calledTwice(getDatapackageStub);
        assert.calledWithExactly(getDatapackageStub, match('datapackageOld').or(match('datapackageNew')), match.object, match.func);

        assert.callOrder(
          configDirStub,
          updateRepoStateStub,
          getFileStatusesDiffStub,
          checkoutHashStub,
          getDatapackageStub,
          checkoutHashStub,
          getDatapackageStub
        );

        return done();
      });

    }));

    it('should return error, when it happens during getting file diff process', sinon.test(function (done) {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const hashFrom = 'aaaaaaa';
      const hashTo = 'bbbbbbb';
      const branchName = 'branch';
      const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const githubUrl = `${repoUrl}#${branchName}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedConfigDir = {pathToRepo, relativePathToRepo, absolutePathToRepos};
      const expectedError = 'Boo!';

      const configDirStub = this.stub(gitFlow, 'configDir').callsArgWithAsync(1, null, expectedConfigDir);
      const updateRepoStateStub = this.stub(utils, 'updateRepoState').callsArgWithAsync(1, null, {});
      const getFileStatusesDiffStub = this.stub(utils, 'getFileStatusesDiff').callsArgWithAsync(1, null, {});
      const checkoutHashStub = this.stub(utils, 'checkoutHash').callsArgWithAsync(2, null, {});
      const getDatapackageStub = this.stub(utils, 'getDatapackage')
        .onFirstCall().callsArgWithAsync(2, null, {})
        .onSecondCall().callsArgWithAsync(2, expectedError);

      // *** Act
      const context = {github: githubUrl, hashFrom, hashTo, absolutePathToRepos, relativePathToRepo};
      return gitFlow.getFileDiffByHashes(context, (error, result) => {
        // *** Assert
        expect(error).to.be.equal(expectedError);
        expect(result).to.not.exist;

        assert.calledOnce(configDirStub);
        assert.calledWithExactly(configDirStub, githubUrl, match.func);

        assert.calledOnce(updateRepoStateStub);
        assert.calledOnce(getFileStatusesDiffStub);

        assert.calledTwice(checkoutHashStub);
        assert.calledWithExactly(checkoutHashStub, match(hashFrom).or(match(hashTo)), match.object, match.func);

        assert.calledTwice(getDatapackageStub);
        assert.calledWithExactly(getDatapackageStub, match('datapackageOld').or(match('datapackageNew')), match.object, match.func);

        assert.callOrder(
          configDirStub,
          updateRepoStateStub,
          getFileStatusesDiffStub,
          checkoutHashStub,
          getDatapackageStub,
          checkoutHashStub,
          getDatapackageStub
        );

        return done();
      });

    }));
  });

  describe('#showFileStateByHash', () => {
    it('should get file states by hashes', sinon.test(function (done) {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const filename = 'ddf--concepts.csv';
      const hashFrom = 'aaaaaaa';
      const hashTo = 'bbbbbbb';
      const branchName = 'branch';
      const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const githubUrl = `${repoUrl}#${branchName}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedConfigDir = {pathToRepo, relativePathToRepo, absolutePathToRepos};
      const expectedResult = {from: 'from', to: 'to'};

      const configDirStub = this.stub(gitFlow, 'configDir').callsArgWithAsync(1, null, expectedConfigDir);
      const gitShowStub = this.stub(utils, 'gitShow')
        .onFirstCall().callsArgWithAsync(3, null, {})
        .onSecondCall().callsArgWithAsync(3, null, _.defaults(expectedConfigDir, expectedResult));

      // *** Act
      const context = {github: githubUrl, hashFrom, hashTo, absolutePathToRepos, relativePathToRepo, pathToRepo};
      return gitFlow.showFileStateByHash(context, filename, (error, result) => {
        // *** Assert
        expect(error).to.not.exist;
        expect(result).to.be.deep.equal(expectedResult);

        assert.calledOnce(configDirStub);
        assert.calledWithExactly(configDirStub, githubUrl, match.func);

        assert.calledTwice(gitShowStub);
        assert.calledWithExactly(
          gitShowStub,
          match('from').or(match('to')),
          match(hashFrom).or(match(hashTo)),
          match(context).or({}),
          match.func
        );

        assert.callOrder(configDirStub, gitShowStub, gitShowStub);

        return done();
      });

    }));

    it('should return error, when it happens during getting file states process', sinon.test(function (done) {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const filename = 'ddf--concepts.csv';
      const hashFrom = 'aaaaaaa';
      const hashTo = 'bbbbbbb';
      const branchName = 'branch';
      const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const githubUrl = `${repoUrl}#${branchName}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedConfigDir = {pathToRepo, relativePathToRepo, absolutePathToRepos};
      const expectedError = 'Boo!';

      const configDirStub = this.stub(gitFlow, 'configDir').callsArgWithAsync(1, null, expectedConfigDir);
      const gitShowStub = this.stub(utils, 'gitShow')
        .onFirstCall().callsArgWithAsync(3, null, {})
        .onSecondCall().callsArgWithAsync(3, expectedError);

      // *** Act
      return gitFlow.showFileStateByHash({github: githubUrl, hashFrom, hashTo}, filename, (error, result) => {
        // *** Assert
        expect(error).to.be.equal(expectedError);
        expect(result).to.not.exist;

        assert.calledOnce(configDirStub);
        assert.calledWithExactly(configDirStub, githubUrl, match.func);

        // TODO: Check that everything is ok
        assert.calledTwice(gitShowStub);
        assert.calledWithExactly(
          gitShowStub,
          match('from').or(match('to')),
          match(hashFrom).or(match(hashTo)),
          match.any,
          match.func
        );

        assert.callOrder(configDirStub, gitShowStub, gitShowStub);

        return done();
      });
    }));
  });

  describe('#validateDataset', () => {
    it('should validate dataset for certain commit', sinon.test(function (done) {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const commit = 'aaaaaaa';
      const branchName = 'branch';
      const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const githubUrl = `${repoUrl}#${branchName}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedConfigDir = {pathToRepo, relativePathToRepo, absolutePathToRepos};

      const configDirStub = this.stub(gitFlow, 'configDir').callsArgWithAsync(1, null, expectedConfigDir);
      const checkoutHashStub = this.stub(utils, 'checkoutHash').callsArgWithAsync(2, null, {});
      const validateDatasetStub = this.stub(utils, 'validateDataset').callsArgWithAsync(1);

      // *** Act
      return gitFlow.validateDataset({github: githubUrl, commit}, (error, result) => {
        // *** Assert
        expect(error).to.not.exist;
        expect(result).to.not.exist;

        assert.calledOnce(configDirStub);
        assert.calledWithExactly(configDirStub, githubUrl, match.func);

        assert.calledOnce(checkoutHashStub);
        assert.calledWithExactly(checkoutHashStub, commit, match(expectedConfigDir), match.func);

        assert.calledOnce(validateDatasetStub);
        assert.calledWithExactly(validateDatasetStub, match.object, match.func);

        assert.callOrder(configDirStub, checkoutHashStub, validateDatasetStub);

        return done();
      });
    }));

    it('should return unexpected error, when it happens during validate dataset process', sinon.test(function (done) {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const commit = 'aaaaaaa';
      const branchName = 'branch';
      const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const githubUrl = `${repoUrl}#${branchName}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedConfigDir = {pathToRepo, relativePathToRepo, absolutePathToRepos};
      const expectedError = 'Boo!';

      const configDirStub = this.stub(gitFlow, 'configDir').callsArgWithAsync(1, null, expectedConfigDir);
      const checkoutHashStub = this.stub(utils, 'checkoutHash').callsArgWithAsync(2, null, {});
      const validateDatasetStub = this.stub(utils, 'validateDataset').callsArgWithAsync(1, expectedError);

      // *** Act
      return gitFlow.validateDataset({github: githubUrl, commit}, (error, result) => {
        // *** Assert
        expect(error).to.be.equal(expectedError);
        expect(result).to.not.exist;

        assert.calledOnce(configDirStub);
        assert.calledWithExactly(configDirStub, githubUrl, match.func);

        assert.calledOnce(checkoutHashStub);
        assert.calledWithExactly(checkoutHashStub, commit, match(expectedConfigDir), match.func);

        assert.calledOnce(validateDatasetStub);
        assert.calledWithExactly(validateDatasetStub, match.object, match.func);

        assert.callOrder(configDirStub, checkoutHashStub, validateDatasetStub);

        return done();
      });
    }));

    it('should return expected error, when issues was found during validate dataset process', sinon.test(function (done) {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const commit = 'aaaaaaa';
      const branchName = 'branch';
      const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const githubUrl = `${repoUrl}#${branchName}`;
      const absolutePathToRepos = process.cwd();
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing';
      const pathToRepo = path.resolve(absolutePathToRepos, relativePathToRepo) + '/';
      const expectedConfigDir = {pathToRepo, relativePathToRepo, absolutePathToRepos};
      const expectedIssues = [{name: 'issue'}];

      const configDirStub = this.stub(gitFlow, 'configDir').callsArgWithAsync(1, null, expectedConfigDir);
      const checkoutHashStub = this.stub(utils, 'checkoutHash').callsArgWithAsync(2, null, {});
      const validateDatasetStub = this.stub(utils, 'validateDataset').callsArgWithAsync(1, expectedIssues);

      // *** Act
      return gitFlow.validateDataset({github: githubUrl, commit}, (error, result) => {
        // *** Assert
        expect(error).to.be.deep.equal(expectedIssues);
        expect(result).to.not.exist;

        assert.calledOnce(configDirStub);
        assert.calledWithExactly(configDirStub, githubUrl, match.func);

        assert.calledOnce(checkoutHashStub);
        assert.calledWithExactly(checkoutHashStub, commit, match(expectedConfigDir), match.func);

        assert.calledOnce(validateDatasetStub);
        assert.calledWithExactly(validateDatasetStub, match.object, match.func);

        assert.callOrder(configDirStub, checkoutHashStub, validateDatasetStub);

        return done();
      });
    }));
  });

  describe('#getDiffFileNameResult', () => {
    it('should get repo name with branch name, when branch was set in giturl', sinon.test(function () {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const branch = 'branch';
      const account = 'VS-work';
      const repo = 'ddf--ws-testing';
      const url = `git@github.com:${account}/${repo}.git`;
      const github = `${url}#${branch}`;
      const sourceFolderPath = path.resolve(`./result`) + '/';
      const repoDescriptor = {branch, url, repo, account};

      const getGithubUrlDescriptorStub = this.stub(utils, 'getGithubUrlDescriptor').returns(repoDescriptor);

      // *** Act
      const diffFileName = gitFlow.getDiffFileNameResult(sourceFolderPath, github, 'lang');

      // *** Assert
      expect(diffFileName).to.be.equal(`${sourceFolderPath}result--${account}--${repo}--${branch}--lang--output.txt`);

      assert.calledOnce(getGithubUrlDescriptorStub);
      assert.calledWithExactly(getGithubUrlDescriptorStub, github);
    }));

    it('should get repo name with branch name, when branch was set in giturl', sinon.test(function () {
      // *** Arrange
      const gitFlow = require('../../../service/git-flow');

      const branch = 'branch';
      const account = 'VS-work';
      const repo = 'ddf--ws-testing';
      const url = `git@github.com:${account}/${repo}.git`;
      const github = `${url}#${branch}`;
      const sourceFolderPath = path.resolve(`./result`) + '/';
      const repoDescriptor = {branch, url, repo, account};

      const getGithubUrlDescriptorStub = this.stub(utils, 'getGithubUrlDescriptor').returns(repoDescriptor);

      // *** Act
      const diffFileName = gitFlow.getDiffFileNameResult(sourceFolderPath, github);

      // *** Assert
      expect(diffFileName).to.be.equal(`${sourceFolderPath}result--${account}--${repo}--${branch}--output.txt`);

      assert.calledOnce(getGithubUrlDescriptorStub);
      assert.calledWithExactly(getGithubUrlDescriptorStub, github);
    }));
  });

  describe('#reposClean', () => {

    it('should remove all repositories in folder repos', sinon.test(function () {
      const gitFlow = require('../../../service/git-flow');
      const pathToRepo = '/test';
      const cliUiStub = this.stub(cliUi, 'state');
      const removeDirForceStub = this.stub(repoService, 'removeDirForce').callsArgWithAsync(1);

      return gitFlow.reposClean(pathToRepo, (error) => {
        expect(error).to.not.exist;

        assert.calledOnce(removeDirForceStub);
        assert.alwaysCalledWithExactly(removeDirForceStub, pathToRepo, match.func);

        assert.calledOnce(cliUiStub);
        assert.alwaysCalledWithExactly(cliUiStub, match(pathToRepo));
      })
    }));

    it('should return error if path to repos isn\'t exists', sinon.test(function () {
      const gitFlow = require('../../../service/git-flow');
      const pathToRepos = '/test';
      const expectedError = `Directory '${pathToRepos}' is not exist!`;
      const cliUiStub = this.stub(cliUi, 'state');
      const removeDirForceStub = this.stub(repoService, 'removeDirForce').callsArgWithAsync(1, expectedError);

      return gitFlow.reposClean(pathToRepos, (error) => {
        expect(error).to.be.equal(expectedError);

        assert.calledOnce(removeDirForceStub);
        assert.alwaysCalledWithExactly(removeDirForceStub, pathToRepo, match.func);

        assert.notCalled(cliUiStub);
      })
    }));

    it('should return error if it happens during cleaning repos folder', sinon.test(function () {
      const gitFlow = require('../../../service/git-flow');
      const pathToRepos = '/test';
      const cliUiStub = this.stub(cliUi, 'state');

      const expectedError = 'Boo!';
      const removeDirForceStub = this.stub(repoService, 'removeDirForce').callsArgWithAsync(1, expectedError);

      return gitFlow.reposClean(pathToRepos, (error) => {
        expect(error).to.be.equal(expectedError);

        assert.calledOnce(removeDirForceStub);
        assert.alwaysCalledWithExactly(removeDirForceStub, pathToRepo, match.func);

        assert.calledOnce(cliUiStub);
        assert.alwaysCalledWithExactly(cliUiStub, match(pathToRepos));
      })
    }));

  })
});