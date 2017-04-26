'use strict';

const _ = require('lodash');
const path = require('path');
const hi = require('highland');
const fs = require('fs');
const shell = require('shelljs');
const ddfValidation = require('ddf-validation');
const JSONStream = require('JSONStream');
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

const cliUi = require('../../../service/cli-ui');
const utils = require('../../../service/git-flow-utils');

describe('Git flow utils', function () {
  describe('#updateRepoState', function () {
    it('should update repo state without errors', sinon.test(function (done) {
      // *** Arrange
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const externalContext = {github, gitFolder, branch, url};
      const expectedCode = 0;
      const expectedStdout = null;
      const expectedStderr = null;

      const simpleGitStub = {
        clone: this.stub().callsArgWithAsync(3),
        fetch: this.stub().callsArgWithAsync(2),
        reset: this.stub().callsArgWithAsync(1),
        silent: this.stub().returnsThis()
      };

      const cliUiStub = this.stub(cliUi, 'state');
      const shellStub = this.stub(shell, 'exec').callsArgWithAsync(2, expectedCode, expectedStdout, expectedStderr);
      const simpleGitWraper = this.stub().returns(simpleGitStub);
      const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

      // *** Act
      return utils.updateRepoState(externalContext, (error, result) => {
        // *** Assert
        expect(error).to.not.exist;
        expect(result).to.be.equal(externalContext);

        assert.calledOnce(shellStub);
        assert.calledWithExactly(shellStub, `ssh -T git@github.com`, {silent: true}, match.func);

        assert.calledThrice(simpleGitStub.silent);
        assert.calledWithExactly(simpleGitStub.silent, true);

        assert.calledOnce(simpleGitStub.clone);
        assert.calledWithExactly(simpleGitStub.clone, url, gitFolder, ['-b', branch], match.func);

        assert.calledOnce(simpleGitStub.fetch);
        assert.calledWithExactly(simpleGitStub.fetch, 'origin', branch, match.func);

        assert.calledOnce(simpleGitStub.reset);
        assert.calledWithExactly(simpleGitStub.reset, ['--hard', 'origin/' + branch], match.func);

        assert.calledThrice(simpleGitWraper);
        assert.calledWithExactly(simpleGitWraper, gitFolder);

        assert.callCount(cliUiStub, 4);
        expect(cliUiStub).inOrder
          .to.have.been.calledWithExactly('ssh, check ssh-key')
          .subsequently.calledWithExactly('git, clone repo')
          .subsequently.calledWithExactly('git, fetch updates')
          .subsequently.calledWithExactly('git, reset changes');

        return done();
      });
    }));

    it('should get an error, when ssh key wasn\'t added to github keys', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const expectedCode = 2;
      const expectedStdout = null;
      const expectedStderr = 'Some text';
      const expectedError = `${cliUi.CONST_FONT_RED}* [code=${expectedCode}] ERROR: ${cliUi.CONST_FONT_YELLOW}${expectedStderr}${cliUi.CONST_FONT_BLUE}\n\tPlease, follow the detailed instruction 'https://github.com/Gapminder/waffle-server-import-cli#ssh-key' for continue working with CLI tool.${cliUi.CONST_FONT_WHITE}`;
      const externalContext = {github, gitFolder, branch, url};

      const cliUiStub = this.stub(cliUi, 'state');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, expectedCode, expectedStdout, expectedStderr);
      const simpleGitStub = {
        clone: this.stub().callsArgWithAsync(3),
        fetch: this.stub().callsArgWithAsync(2),
        reset: this.stub().callsArgWithAsync(1),
        silent: this.stub().returnsThis()
      };

      const simpleGitWraper = this.stub().returns(simpleGitStub);
      const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

      return utils.updateRepoState(externalContext, (error, result) => {
        expect(error).to.be.equal(expectedError);
        expect(result).to.be.equal(externalContext);

        assert.calledOnce(execStub);
        assert.calledWithExactly(execStub, `ssh -T git@github.com`, {silent: true}, match.func);

        assert.calledOnce(cliUiStub);
        assert.calledWithExactly(cliUiStub, 'ssh, check ssh-key');

        assert.notCalled(simpleGitStub.silent);
        assert.notCalled(simpleGitStub.clone);
        assert.notCalled(simpleGitStub.fetch);
        assert.notCalled(simpleGitStub.reset);
        assert.notCalled(simpleGitWraper);

        return done();
      });
    }));

    it('should get an error, when error happens during cloning process', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const externalContext = {github, gitFolder, branch, url};

      const expectedCode = 1;
      const expectedStdout = null;
      const expectedStderr = null;
      const expectedError = 'Boo!';

      const cliUiStub = this.stub(cliUi, 'state');
      const shellStub = this.stub(shell, 'exec').callsArgWithAsync(2, expectedCode, expectedStdout, expectedStderr);
      const simpleGitStub = {
        clone: this.stub().callsArgWithAsync(3, expectedError),
        fetch: this.stub().callsArgWithAsync(2),
        reset: this.stub().callsArgWithAsync(1),
        silent: this.stub().returnsThis()
      };

      const simpleGitWraper = this.stub().returns(simpleGitStub);
      const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

      return utils.updateRepoState(externalContext, (error, result) => {
        expect(error).to.be.equal(expectedError);
        expect(result).to.be.equal(externalContext);

        assert.calledOnce(shellStub);
        assert.calledWithExactly(shellStub, `ssh -T git@github.com`, {silent: true}, match.func);

        assert.calledOnce(simpleGitStub.silent);
        assert.calledWithExactly(simpleGitStub.silent, true);

        assert.calledOnce(simpleGitStub.clone);
        assert.calledWithExactly(simpleGitStub.clone, url, gitFolder, ['-b', branch], match.func);

        assert.notCalled(simpleGitStub.fetch);
        assert.notCalled(simpleGitStub.reset);

        assert.calledOnce(simpleGitWraper);
        assert.calledWithExactly(simpleGitWraper, gitFolder);

        assert.calledTwice(cliUiStub);
        expect(cliUiStub).inOrder
          .to.have.been.calledWithExactly('ssh, check ssh-key')
          .subsequently.calledWithExactly('git, clone repo');

        return done();
      });
    }));

    it('should register repo without errors, when specified error happens during git clone', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const externalContext = {github, gitFolder, branch, url};

      const expectedCode = 1;
      const expectedStdout = null;
      const expectedStderr = null;
      const expectedError = `fatal: destination path '${url}' already exists and is not an empty directory.`;

      const cliUiStub = this.stub(cliUi, 'state');
      const shellStub = this.stub(shell, 'exec').callsArgWithAsync(2, expectedCode, expectedStdout, expectedStderr);
      const simpleGitStub = {
        clone: this.stub().callsArgWithAsync(3, expectedError),
        fetch: this.stub().callsArgWithAsync(2),
        reset: this.stub().callsArgWithAsync(1),
        silent: this.stub().returnsThis()
      };

      const simpleGitWraper = this.stub().returns(simpleGitStub);

      const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

      return utils.updateRepoState(externalContext, (error, result) => {
        expect(error).to.not.exist;
        expect(result).to.be.equal(externalContext);

        assert.calledOnce(shellStub);
        assert.calledWithExactly(shellStub, `ssh -T git@github.com`, {silent: true}, match.func);

        assert.calledThrice(simpleGitStub.silent);
        assert.calledWithExactly(simpleGitStub.silent, true);

        assert.calledOnce(simpleGitStub.clone);
        assert.calledWithExactly(simpleGitStub.clone, url, gitFolder, ['-b', branch], match.func);

        assert.calledOnce(simpleGitStub.fetch);
        assert.calledWithExactly(simpleGitStub.fetch, 'origin', branch, match.func);

        assert.calledOnce(simpleGitStub.reset);
        assert.calledWithExactly(simpleGitStub.reset, ['--hard', 'origin/' + branch], match.func);

        assert.calledThrice(simpleGitWraper);
        assert.calledWithExactly(simpleGitWraper, gitFolder);

        assert.callCount(cliUiStub, 4);
        expect(cliUiStub).inOrder
          .to.have.been.calledWithExactly('ssh, check ssh-key')
          .subsequently.calledWithExactly('git, clone repo')
          .subsequently.calledWithExactly('git, fetch updates')
          .subsequently.calledWithExactly('git, reset changes');

        return done();
      });
    }));

    it('should get an error, when error happens during reset changes process', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const externalContext = {github, gitFolder, branch, url};

      const expectedCode = 1;
      const expectedStdout = null;
      const expectedStderr = null;
      const expectedError = 'Boo!';

      const cliUiStub = this.stub(cliUi, 'state');
      const shellStub = this.stub(shell, 'exec').callsArgWithAsync(2, expectedCode, expectedStdout, expectedStderr);
      const simpleGitStub = {
        clone: this.stub().callsArgWithAsync(3),
        reset: this.stub().callsArgWithAsync(1, expectedError),
        fetch: this.stub().callsArgWithAsync(2),
        silent: this.stub().returnsThis()
      };

      const simpleGitWraper = this.stub().returns(simpleGitStub);
      const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

      return utils.updateRepoState(externalContext, (error) => {
        expect(error).to.be.equal(expectedError);

        assert.calledOnce(shellStub);
        assert.calledWithExactly(shellStub, `ssh -T git@github.com`, {silent: true}, match.func);

        assert.calledThrice(simpleGitStub.silent);
        assert.calledWithExactly(simpleGitStub.silent, true);

        assert.calledOnce(simpleGitStub.clone);
        assert.calledWithExactly(simpleGitStub.clone, url, gitFolder, ['-b', branch], match.func);

        assert.calledOnce(simpleGitStub.fetch);
        assert.calledWithExactly(simpleGitStub.fetch, 'origin', branch, match.func);

        assert.calledOnce(simpleGitStub.reset);
        assert.calledWithExactly(simpleGitStub.reset, ['--hard', 'origin/' + branch], match.func);

        assert.calledThrice(simpleGitWraper);
        assert.calledWithExactly(simpleGitWraper, gitFolder);

        assert.callCount(cliUiStub, 4);
        expect(cliUiStub).inOrder
          .to.have.been.calledWithExactly('ssh, check ssh-key')
          .subsequently.calledWithExactly('git, clone repo')
          .subsequently.calledWithExactly('git, fetch updates')
          .subsequently.calledWithExactly('git, reset changes');

        return done();
      });
    }));

    it('should get an error, when error happens during fetching updates process', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const externalContext = {github, gitFolder, branch, url};

      const expectedCode = 0;
      const expectedStdout = null;
      const expectedStderr = null;
      const expectedError = 'Boo!';

      const cliUiStub = this.stub(cliUi, 'state');
      const shellStub = this.stub(shell, 'exec').callsArgWithAsync(2, expectedCode, expectedStdout, expectedStderr);
      const simpleGitStub = {
        clone: this.stub().callsArgWithAsync(3),
        reset: this.stub().callsArgWithAsync(1),
        fetch: this.stub().callsArgWithAsync(2, expectedError),
        silent: this.stub().returnsThis()
      };

      const simpleGitWraper = this.stub().returns(simpleGitStub);

      const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

      return utils.updateRepoState(externalContext, (error) => {
        expect(error).to.be.equal(expectedError);

        assert.calledOnce(shellStub);
        assert.calledWithExactly(shellStub, `ssh -T git@github.com`, {silent: true}, match.func);

        assert.calledTwice(simpleGitStub.silent);
        assert.calledWithExactly(simpleGitStub.silent, true);

        assert.calledOnce(simpleGitStub.clone);
        assert.calledWithExactly(simpleGitStub.clone, url, gitFolder, ['-b', branch], match.func);

        assert.calledOnce(simpleGitStub.fetch);
        assert.calledWithExactly(simpleGitStub.fetch, 'origin', branch, match.func);

        assert.notCalled(simpleGitStub.reset);

        assert.callCount(cliUiStub, 3);
        expect(cliUiStub).inOrder
          .to.have.been.calledWithExactly('ssh, check ssh-key')
          .subsequently.calledWithExactly('git, clone repo')
          .subsequently.calledWithExactly('git, fetch updates');

        return done();
      });
    }));
  });

  it('should return detailed commits list from git log', sinon.test(function (done) {
    const branch = 'branch';
    const url = 'git@github.com:VS-work/ddf--ws-testing.git';
    const github = `${url}#${branch}`;
    const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
    const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
    const externalContext = {github, gitFolder, branch, url};
    const expectedDate = Date.now();
    const detailedCommitsList = [
      {
        hash: '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2',
        message: 'Test message',
        date: expectedDate + 1
      }, {
        hash: '37f87b6383bb8c0e416f275b79b351dab0881925',
        message: 'Test message 2',
        date: expectedDate
      }
    ];
    const simpleGitStub = {
      log: this.stub().callsArgWithAsync(0, null, {all: detailedCommitsList}),
      silent: this.stub().returnsThis()
    };

    const cliUiStub = this.stub(cliUi, 'state');
    const simpleGitWraper = this.stub().returns(simpleGitStub);
    const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

    return utils.gitLog(externalContext, (error, result) => {
      // *** Assert
      expect(error).to.not.exist;
      expect(result).to.be.deep.equal(_.defaults({detailedCommitsList}, externalContext));

      assert.calledOnce(simpleGitStub.silent);
      assert.calledWithExactly(simpleGitStub.silent, true);

      assert.calledOnce(simpleGitStub.log);
      assert.calledWithExactly(simpleGitStub.log, match.func);

      assert.calledOnce(simpleGitWraper);
      assert.calledWithExactly(simpleGitWraper, gitFolder);

      assert.calledOnce(cliUiStub);
      assert.calledWithExactly(cliUiStub, 'git, get commits log');

      return done();
    });
  }));

  it('should return error when it happens during getting git repo log', sinon.test(function (done) {
    const branch = 'branch';
    const url = 'git@github.com:VS-work/ddf--ws-testing.git';
    const github = `${url}#${branch}`;
    const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
    const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
    const externalContext = {github, gitFolder, branch, url};
    const expectedError = 'Boo!';

    const simpleGitStub = {
      log: this.stub().callsArgWithAsync(0, expectedError, null),
      silent: this.stub().returnsThis()
    };

    const cliUiStub = this.stub(cliUi, 'state');
    const simpleGitWraper = this.stub().returns(simpleGitStub);
    const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

    return utils.gitLog(externalContext, (error, result) => {
      // *** Assert
      expect(error).to.be.equal(expectedError);
      expect(result).to.be.deep.equal(_.defaults({detailedCommitsList: null}, externalContext));

      assert.calledOnce(simpleGitStub.silent);
      assert.calledWithExactly(simpleGitStub.silent, true);

      assert.calledOnce(simpleGitStub.log);
      assert.calledWithExactly(simpleGitStub.log, match.func);

      assert.calledOnce(simpleGitWraper);
      assert.calledWithExactly(simpleGitWraper, gitFolder);

      assert.calledOnce(cliUiStub);
      assert.calledWithExactly(cliUiStub, 'git, get commits log');

      return done();
    });
  }));

  it('should return detailed notes from git show command', sinon.test(function (done) {
    const branch = 'branch';
    const url = 'git@github.com:VS-work/ddf--ws-testing.git';
    const github = `${url}#${branch}`;
    const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
    const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
    const externalContext = {github, gitFolder, branch, url};
    const field = 'from';
    const hash = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
    const expectedResult = {
      commit: '57a3bc8576fb3aed6b676f4bd53391c84068f866',
      Author: 'Test test Test <test@gmail.com>',
      Date: 'Mon Mar 20 13:37:43 2017 +0200'
    };
    const simpleGitStub = {
      show: this.stub().callsArgWithAsync(1, null, expectedResult),
      silent: this.stub().returnsThis()
    };

    const cliUiStub = this.stub(cliUi, 'state');
    const warnStub = this.stub(console, 'warn');
    const simpleGitWraper = this.stub().returns(simpleGitStub);
    const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

    return utils.gitShow(field, hash, externalContext, (error, result) => {
      // *** Assert
      expect(error).to.not.exist;
      expect(result).to.be.deep.equal(_.defaults({[field]: expectedResult}, externalContext));

      assert.calledOnce(simpleGitStub.silent);
      assert.calledWithExactly(simpleGitStub.silent, true);

      assert.calledOnce(simpleGitStub.show);
      assert.calledWithExactly(simpleGitStub.show, [hash], match.func);

      assert.notCalled(warnStub);

      assert.calledOnce(simpleGitWraper);
      assert.calledWithExactly(simpleGitWraper, gitFolder);

      assert.calledOnce(cliUiStub);
      assert.calledWithExactly(cliUiStub, 'git, get repo notes');

      return done();
    });
  }));

  it('should return empty string as a result when error happens during getting git repo notes', sinon.test(function (done) {
    const branch = 'branch';
    const url = 'git@github.com:VS-work/ddf--ws-testing.git';
    const github = `${url}#${branch}`;
    const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
    const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
    const externalContext = {github, gitFolder, branch, url};
    const field = 'to';
    const hash = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
    const expectedResult = {
      commit: '57a3bc8576fb3aed6b676f4bd53391c84068f866',
      Author: 'Test test Test <test@gmail.com>',
      Date: 'Mon Mar 20 13:37:43 2017 +0200'
    };
    const expectedError = 'does not exist in';
    const simpleGitStub = {
      show: this.stub().callsArgWithAsync(1, expectedError, expectedResult),
      silent: this.stub().returnsThis()
    };

    const cliUiStub = this.stub(cliUi, 'state');
    const simpleGitWraper = this.stub().returns(simpleGitStub);
    const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

    return utils.gitShow(field, hash, externalContext, (error, result) => {
      // *** Assert
      expect(error).to.not.exist;
      expect(result).to.be.deep.equal(_.defaults({[field]: ''}, externalContext));

      assert.calledOnce(simpleGitStub.silent);
      assert.calledWithExactly(simpleGitStub.silent, true);

      assert.calledOnce(simpleGitStub.show);
      assert.calledWithExactly(simpleGitStub.show, [hash], match.func);

      assert.calledOnce(simpleGitWraper);
      assert.calledWithExactly(simpleGitWraper, gitFolder);

      assert.calledOnce(cliUiStub);
      assert.calledWithExactly(cliUiStub, 'git, get repo notes');

      return done();
    });
  }));

  describe('#getFileNamesDiff', function() {
    it('should return empty list of file name diffs from git diff command', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const hashFrom = '66a50bb25be90d69a94a3904611363ee20a87848';
      const hashTo = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
      const externalContext = {hashFrom, gitFolder, hashTo};
      const expectedResult = '';
      const simpleGitStub = {
        diff: this.stub().callsArgWithAsync(1, null, expectedResult),
        silent: this.stub().returnsThis()
      };

      const cliUiStub = this.stub(cliUi, 'state');
      const simpleGitWraper = this.stub().returns(simpleGitStub);
      const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

      return utils.getFileNamesDiff(externalContext, (error, result) => {
        // *** Assert
        expect(error).to.not.exist;
        expect(result).to.be.deep.equal(_.defaults({gitDiffFileList: []}, externalContext));

        assert.calledOnce(simpleGitStub.silent);
        assert.calledWithExactly(simpleGitStub.silent, true);

        assert.calledOnce(simpleGitStub.diff);
        assert.calledWithExactly(simpleGitStub.diff, [hashFrom + '..' + hashTo, '--name-only'], match.func);

        assert.calledOnce(simpleGitWraper);
        assert.calledWithExactly(simpleGitWraper, gitFolder);

        assert.calledOnce(cliUiStub);
        assert.calledWithExactly(cliUiStub, `git, get diff file names only`);

        return done();
      });
    }));

    it('should return list of file name diffs from git diff command', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const hashFrom = '66a50bb25be90d69a94a3904611363ee20a87848';
      const hashTo = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
      const externalContext = {hashFrom, gitFolder, hashTo};
      const expectedResult = `
datapackage.json
ddf--concepts.csv
ddf--datapoints--company_scale--by--company--anno.csv
ddf--entities--company--company_scale.csv
ddf--entities--company.csv
lang/nl-nl/ddf--concepts.csv
lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv
    `;
      const simpleGitStub = {
        diff: this.stub().callsArgWithAsync(1, null, expectedResult),
        silent: this.stub().returnsThis()
      };

      const cliUiStub = this.stub(cliUi, 'state');
      const simpleGitWraper = this.stub().returns(simpleGitStub);
      const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

      return utils.getFileNamesDiff(externalContext, (error, result) => {
        // *** Assert
        expect(error).to.not.exist;
        expect(result).to.be.deep.equal(_.defaults({gitDiffFileList: [
          'ddf--concepts.csv',
          'ddf--datapoints--company_scale--by--company--anno.csv',
          'ddf--entities--company--company_scale.csv',
          'ddf--entities--company.csv',
          'lang/nl-nl/ddf--concepts.csv',
          'lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv',
        ]}, externalContext));

        assert.calledOnce(simpleGitStub.silent);
        assert.calledWithExactly(simpleGitStub.silent, true);

        assert.calledOnce(simpleGitStub.diff);
        assert.calledWithExactly(simpleGitStub.diff, [hashFrom + '..' + hashTo, '--name-only'], match.func);

        assert.calledOnce(simpleGitWraper);
        assert.calledWithExactly(simpleGitWraper, gitFolder);

        assert.calledOnce(cliUiStub);
        assert.calledWithExactly(cliUiStub, 'git, get diff file names only');

        return done();
      });
    }));

    it('should return error when it happens during git diff file names command', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const hashFrom = '66a50bb25be90d69a94a3904611363ee20a87848';
      const hashTo = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
      const externalContext = {hashFrom, gitFolder, hashTo};
      const expectedResult = `
datapackage.json
ddf--concepts.csv
ddf--datapoints--company_scale--by--company--anno.csv
ddf--entities--company--company_scale.csv
ddf--entities--company.csv
lang/nl-nl/ddf--concepts.csv
lang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv
    `;
      const expectedError = 'Boo!';

      const simpleGitStub = {
        diff: this.stub().callsArgWithAsync(1, expectedError, expectedResult),
        silent: this.stub().returnsThis()
      };

      const cliUiStub = this.stub(cliUi, 'state');
      const simpleGitWraper = this.stub().returns(simpleGitStub);
      const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

      return utils.getFileNamesDiff(externalContext, (error, result) => {
        // *** Assert
        expect(error).to.be.equal(expectedError);
        expect(result).to.not.exist;

        assert.calledOnce(simpleGitStub.silent);
        assert.calledWithExactly(simpleGitStub.silent, true);

        assert.calledOnce(simpleGitStub.diff);
        assert.calledWithExactly(simpleGitStub.diff, [hashFrom + '..' + hashTo, '--name-only'], match.func);

        assert.calledOnce(simpleGitWraper);
        assert.calledWithExactly(simpleGitWraper, gitFolder);

        assert.calledOnce(cliUiStub);
        assert.calledWithExactly(cliUiStub, 'git, get diff file names only');

        return done();
      });
    }));
  });

  describe('#getFileStatusesDiff', function() {
    it('should return empty list of file name diffs from git diff command', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const hashFrom = '66a50bb25be90d69a94a3904611363ee20a87848';
      const hashTo = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
      const externalContext = {hashFrom, gitFolder, hashTo};
      const expectedResult = '';
      const simpleGitStub = {
        diff: this.stub().callsArgWithAsync(1, null, expectedResult),
        silent: this.stub().returnsThis()
      };

      const cliUiStub = this.stub(cliUi, 'state');
      const simpleGitWraper = this.stub().returns(simpleGitStub);
      const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

      return utils.getFileStatusesDiff(externalContext, (error, result) => {
        // *** Assert
        expect(error).to.not.exist;
        expect(result).to.be.deep.equal(_.defaults({gitDiffFileStatus: {}}, externalContext));

        assert.calledOnce(simpleGitStub.silent);
        assert.calledWithExactly(simpleGitStub.silent, true);

        assert.calledOnce(simpleGitStub.diff);
        assert.calledWithExactly(simpleGitStub.diff, [hashFrom + '..' + hashTo, '--name-status'], match.func);

        assert.calledOnce(simpleGitWraper);
        assert.calledWithExactly(simpleGitWraper, gitFolder);

        assert.calledOnce(cliUiStub);
        assert.calledWithExactly(cliUiStub, 'git, get diff file names with states');

        return done();
      });
    }));

    it('should return list of files status diffs from git diff command', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const hashFrom = '66a50bb25be90d69a94a3904611363ee20a87848';
      const hashTo = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
      const externalContext = {hashFrom, gitFolder, hashTo};
      const expectedResult = `
M\tdatapackage.json
M\tddf--concepts.csv
A\tddf--datapoints--company_scale--by--company--anno.csv
M\tddf--entities--company--company_scale.csv
D\tddf--entities--company.csv
A\tlang/nl-nl/ddf--concepts.csv
A\tlang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv
    `;
      const simpleGitStub = {
        diff: this.stub().callsArgWithAsync(1, null, expectedResult),
        silent: this.stub().returnsThis()
      };

      const cliUiStub = this.stub(cliUi, 'state');
      const simpleGitWraper = this.stub().returns(simpleGitStub);
      const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

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

        assert.calledOnce(simpleGitStub.silent);
        assert.calledWithExactly(simpleGitStub.silent, true);

        assert.calledOnce(simpleGitStub.diff);
        assert.calledWithExactly(simpleGitStub.diff, [hashFrom + '..' + hashTo, '--name-status'], match.func);

        assert.calledOnce(simpleGitWraper);
        assert.calledWithExactly(simpleGitWraper, gitFolder);

        assert.calledOnce(cliUiStub);
        assert.calledWithExactly(cliUiStub, 'git, get diff file names with states');

        return done();
      });
    }));

    it('should return error when it happens during git diff files status command', sinon.test(function (done) {
      const branch = 'branch';
      const url = 'git@github.com:VS-work/ddf--ws-testing.git';
      const github = `${url}#${branch}`;
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const hashFrom = '66a50bb25be90d69a94a3904611363ee20a87848';
      const hashTo = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
      const externalContext = {hashFrom, gitFolder, hashTo};
      const expectedResult = `
M\tdatapackage.json
M\tddf--concepts.csv
A\tddf--datapoints--company_scale--by--company--anno.csv
M\tddf--entities--company--company_scale.csv
D\tddf--entities--company.csv
A\tlang/nl-nl/ddf--concepts.csv
A\tlang/nl-nl/ddf--datapoints--company_scale--by--company--anno.csv
    `;
      const expectedError = 'Boo!';

      const simpleGitStub = {
        diff: this.stub().callsArgWithAsync(1, expectedError, expectedResult),
        silent: this.stub().returnsThis()
      };

      const cliUiStub = this.stub(cliUi, 'state');
      const simpleGitWraper = this.stub().returns(simpleGitStub);
      const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

      return utils.getFileStatusesDiff(externalContext, (error, result) => {
        // *** Assert
        expect(error).to.be.equal(expectedError);
        expect(result).to.not.exist;

        assert.calledOnce(simpleGitStub.silent);
        assert.calledWithExactly(simpleGitStub.silent, true);

        assert.calledOnce(simpleGitStub.diff);
        assert.calledWithExactly(simpleGitStub.diff, [hashFrom + '..' + hashTo, '--name-status'], match.func);

        assert.calledOnce(simpleGitWraper);
        assert.calledWithExactly(simpleGitWraper, gitFolder);

        assert.calledOnce(cliUiStub);
        assert.calledWithExactly(cliUiStub, 'git, get diff file names with states');

        return done();
      });
    }));
  });

  it('should checkout to certain hash without error', sinon.test(function (done) {
    const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
    const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
    const externalContext = {gitFolder};
    const hash = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';

    const simpleGitStub = {
      checkout: this.stub().callsArgWithAsync(1),
      silent: this.stub().returnsThis()
    };

    const cliUiStub = this.stub(cliUi, 'state');
    const simpleGitWraper = this.stub().returns(simpleGitStub);
    const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

    return utils.checkoutHash(hash, externalContext, (error, result) => {
      // *** Assert
      expect(error).to.not.exist;
      expect(result).to.be.deep.equal(externalContext);

      assert.calledOnce(simpleGitStub.silent);
      assert.calledWithExactly(simpleGitStub.silent, true);

      assert.calledOnce(simpleGitStub.checkout);
      assert.calledWithExactly(simpleGitStub.checkout, hash, match.func);

      assert.calledOnce(simpleGitWraper);
      assert.calledWithExactly(simpleGitWraper, gitFolder);

      assert.calledOnce(cliUiStub);
      assert.calledWithExactly(cliUiStub, `git, checkout to '${hash}'`);

      return done();
    });
  }));

  it('should return error when it happens during git checkout command', sinon.test(function (done) {
    const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
    const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
    const externalContext = {gitFolder};
    const hash = '5166a22e66b5b8bb9f95c6581179dee4e4e8eeb2';
    const expectedError = 'Boo!';

    const simpleGitStub = {
      checkout: this.stub().callsArgWithAsync(1, expectedError),
      silent: this.stub().returnsThis()
    };

    const cliUiStub = this.stub(cliUi, 'state');
    const simpleGitWraper = this.stub().returns(simpleGitStub);
    const utils = proxyquire('../../../service/git-flow-utils', {'simple-git': simpleGitWraper});

    return utils.checkoutHash(hash, externalContext, (error, result) => {
      // *** Assert
      expect(error).to.be.equal(expectedError);
      expect(result).to.not.exist;

      assert.calledOnce(simpleGitStub.silent);
      assert.calledWithExactly(simpleGitStub.silent, true);

      assert.calledOnce(simpleGitStub.checkout);
      assert.calledWithExactly(simpleGitStub.checkout, hash, match.func);

      assert.calledOnce(simpleGitWraper);
      assert.calledWithExactly(simpleGitWraper, gitFolder);

      assert.calledOnce(cliUiStub);
      assert.calledWithExactly(cliUiStub, `git, checkout to '${hash}'`);

      return done();
    });
  }));

  describe('#validateDataset', function() {
    it('should validate dataset without error', sinon.test(function (done) {
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
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

      return utils.validateDataset({gitFolder}, (error) => {
        expect(error).to.not.exist;

        assert.calledOnce(streamValidatorStub.validate);
        assert.calledOnce(streamValidatorStub.emit);
        assert.calledTwice(streamValidatorStub.on);
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
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
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

      return utils.validateDataset({gitFolder}, (error) => {
        expect(error).to.be.deep.equal([issue]);

        assert.calledOnce(streamValidatorStub.validate);
        assert.calledTwice(streamValidatorStub.emit);
        assert.calledTwice(streamValidatorStub.on);
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
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
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

      return utils.validateDataset({gitFolder}, (error) => {
        expect(error).to.be.equal(expectedError);

        assert.calledOnce(streamValidatorStub.validate);
        assert.calledOnce(streamValidatorStub.emit);
        assert.calledTwice(streamValidatorStub.on);
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
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const externalContext = {gitFolder, metadata: {}};
      const propertyName = 'old';
      const datapackage = require('./fixtures/datapackage.json');

      const existsSyncStub = this.stub(fs, 'existsSync').returns(true);
      const createReadStreamStub = this.stub(fs, 'createReadStream').returns(hi());
      const JSONStreamStub = this.stub(JSONStream, 'parse').returns(hi([datapackage]));

      const expectedDatapackagePath = `${gitFolder}datapackage.json`;

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
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const externalContext = {gitFolder, metadata: {}};
      const propertyName = 'old';
      const datapackage = require('./fixtures/datapackage.json');

      const existsSyncStub = this.stub(fs, 'existsSync').returns(false);
      const createReadStreamStub = this.stub(fs, 'createReadStream').returns(hi());
      const JSONStreamStub = this.stub(JSONStream, 'parse').returns(hi());

      const expectedDatapackagePath = `${gitFolder}datapackage.json`;

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
      const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
      const gitFolder = path.resolve(`./repos/${expectedRelativeRepoFolder}`) + '/';
      const externalContext = {gitFolder, metadata: {}};
      const propertyName = 'old';
      const datapackage = require('./fixtures/datapackage.json');
      const expectedError = new Error('Boo!');

      const existsSyncStub = this.stub(fs, 'existsSync').returns(true);
      const createReadStreamStub = this.stub(fs, 'createReadStream').returns(hi());
      const JSONStreamStub = this.stub(JSONStream, 'parse').returns(hi.fromError(expectedError));

      const expectedDatapackagePath = `${gitFolder}datapackage.json`;

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