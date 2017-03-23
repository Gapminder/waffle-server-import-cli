'use strict';

const _ = require('lodash');
const fs = require('fs');
const shell = require('shelljs');
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

describe('#git', function () {
  xit('should make it without errors 2', sinon.test(function (done) {
    const branchName = 'branch';
    const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const githubUrl = `${repoUrl}#${branchName}`;
    const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
    const expectedConfigDir = `/home/user/Project/waffle-server-import-cli/repos/${expectedRelativeRepoFolder}/`;
    const expectedCode = 0;
    const expectedStdout = null;
    const expectedStderr = null;
    const expectedError = null;

    const simpleGitStub = {
      clone: this.stub().callsArgWithAsync(3, expectedError),
      fetch: this.stub().callsArgWithAsync(2, expectedError),
      reset: this.stub().callsArgWithAsync(1, expectedError),
      silent: this.stub().returnsThis()
    };

    const simpleGitWraper = this.stub().returns(simpleGitStub);

    const gitFlow = proxyquire('../../../service/git-flow', {
      'simple-git': simpleGitWraper
    });

    const configDirStub = this.stub(gitFlow, 'configDir').returns(expectedConfigDir);

    return gitFlow.registerRepo(githubUrl, (error) => {
      expect(error).to.not.exist;

      assert.calledOnce(configDirStub);
      assert.calledWithExactly(configDirStub, githubUrl);

      assert.calledOnce(shellStub);
      assert.calledWithExactly(shellStub, `ssh -T git@github.com`, {silent: true}, match.func);

      assert.calledThrice(simpleGitStub.silent);
      assert.calledWithExactly(simpleGitStub.silent, true);

      assert.calledOnce(simpleGitStub.clone);
      assert.calledWithExactly(simpleGitStub.clone, repoUrl, expectedConfigDir, [
        '-b',
        branchName
      ], match.func);

      assert.calledOnce(simpleGitStub.fetch);
      assert.calledWithExactly(simpleGitStub.fetch, 'origin', branchName, match.func);

      assert.calledOnce(simpleGitStub.reset);
      assert.calledWithExactly(simpleGitStub.reset, ['--hard', 'origin/' + branchName], match.func);

      assert.calledThrice(simpleGitWraper);
      assert.calledWithExactly(simpleGitWraper, expectedConfigDir);

      assert.callCount(cliUiStub, 4);
      expect(cliUiStub).inOrder
        .to.have.been.calledWithExactly('ssh, check ssh-key')
        .subsequently.calledWithExactly('git, try to clone repo')
        .subsequently.calledWithExactly('git, reset changes')
        .subsequently.calledWithExactly('git, fetch updates');

      return done();
    });
  }));

  xit('should get an error, when ssh key wasn\'t added to github keys 2', sinon.test(function (done) {
    const branchName = 'branch';
    const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const githubUrl = `${repoUrl}#${branchName}`;
    const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
    const expectedConfigDir = `/home/user/Project/waffle-server-import-cli/repos/${expectedRelativeRepoFolder}/`;
    const expectedCode = 2;
    const expectedStdout = null;
    const expectedStderr = 'Some text';
    const expectedError = `${cliUi.CONST_FONT_RED}* [code=${expectedCode}] ERROR: ${cliUi.CONST_FONT_YELLOW}${expectedStderr}${cliUi.CONST_FONT_BLUE}\n\tPlease, follow the detailed instruction 'https://github.com/Gapminder/waffle-server-import-cli#ssh-key' for continue working with CLI tool.${cliUi.CONST_FONT_WHITE}`;

    const cliUiStub = this.stub(cliUi, 'state');
    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, expectedCode, expectedStdout, expectedStderr);
    const simpleGitStub = {
      clone: this.stub().callsArgWithAsync(3),
      fetch: this.stub().callsArgWithAsync(2),
      reset: this.stub().callsArgWithAsync(1),
      silent: this.stub().returnsThis()
    };

    const simpleGitWraper = this.stub().returns(simpleGitStub);

    const gitFlow = proxyquire('../../../service/git-flow', {
      'simple-git': simpleGitWraper
    });

    const configDirStub = this.stub(gitFlow, 'configDir').returns(expectedConfigDir);

    return gitFlow.registerRepo(githubUrl, (error) => {
      expect(error).to.be.equal(expectedError);

      assert.calledOnce(configDirStub);
      assert.calledWithExactly(configDirStub, githubUrl);

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

  xit('should get an error, when error happens during cloning process 2', sinon.test(function (done) {
    const branchName = 'branch';
    const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const githubUrl = `${repoUrl}#${branchName}`;
    const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
    const expectedConfigDir = `/home/user/Project/waffle-server-import-cli/repos/${expectedRelativeRepoFolder}/`;
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

    const gitFlow = proxyquire('../../../service/git-flow', {
      'simple-git': simpleGitWraper
    });

    const configDirStub = this.stub(gitFlow, 'configDir').returns(expectedConfigDir);

    return gitFlow.registerRepo(githubUrl, (error) => {
      expect(error).to.be.equal(expectedError);

      assert.calledOnce(configDirStub);
      assert.calledWithExactly(configDirStub, githubUrl);

      assert.calledOnce(shellStub);
      assert.calledWithExactly(shellStub, `ssh -T git@github.com`, {silent: true}, match.func);

      assert.calledOnce(simpleGitStub.silent);
      assert.calledWithExactly(simpleGitStub.silent, true);

      assert.calledOnce(simpleGitStub.clone);
      assert.calledWithExactly(simpleGitStub.clone, repoUrl, expectedConfigDir, [
        '-b',
        branchName
      ], match.func);

      assert.notCalled(simpleGitStub.fetch);
      assert.notCalled(simpleGitStub.reset);

      assert.calledOnce(simpleGitWraper);
      assert.calledWithExactly(simpleGitWraper, expectedConfigDir);

      assert.calledTwice(cliUiStub);
      expect(cliUiStub).inOrder
        .to.have.been.calledWithExactly('ssh, check ssh-key')
        .subsequently.calledWithExactly('git, try to clone repo');

      return done();
    });
  }));

  xit('should register repo without errors, when specified error happens during git clone 2', sinon.test(function (done) {
    const branchName = 'branch';
    const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const githubUrl = `${repoUrl}#${branchName}`;
    const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
    const expectedConfigDir = `/home/user/Project/waffle-server-import-cli/repos/${expectedRelativeRepoFolder}/`;
    const expectedCode = 1;
    const expectedStdout = null;
    const expectedStderr = null;
    const expectedError = `fatal: destination path '${repoUrl}' already exists and is not an empty directory.`;

    const cliUiStub = this.stub(cliUi, 'state');
    const warnStub = this.stub(console, 'warn');
    const shellStub = this.stub(shell, 'exec').callsArgWithAsync(2, expectedCode, expectedStdout, expectedStderr);
    const simpleGitStub = {
      clone: this.stub().callsArgWithAsync(3, expectedError),
      fetch: this.stub().callsArgWithAsync(2),
      reset: this.stub().callsArgWithAsync(1),
      silent: this.stub().returnsThis()
    };

    const simpleGitWraper = this.stub().returns(simpleGitStub);

    const gitFlow = proxyquire('../../../service/git-flow', {
      'simple-git': simpleGitWraper
    });

    const configDirStub = this.stub(gitFlow, 'configDir').returns(expectedConfigDir);

    return gitFlow.registerRepo(githubUrl, (error) => {
      expect(error).to.not.exist;

      assert.calledOnce(configDirStub);
      assert.calledWithExactly(configDirStub, githubUrl);

      assert.calledOnce(shellStub);
      assert.calledWithExactly(shellStub, `ssh -T git@github.com`, {silent: true}, match.func);

      assert.calledThrice(simpleGitStub.silent);
      assert.calledWithExactly(simpleGitStub.silent, true);

      assert.calledOnce(simpleGitStub.clone);
      assert.calledWithExactly(simpleGitStub.clone, repoUrl, expectedConfigDir, [
        '-b',
        branchName
      ], match.func);

      assert.calledOnce(warnStub);
      assert.calledWithExactly(warnStub, expectedError);

      assert.calledOnce(simpleGitStub.fetch);
      assert.calledWithExactly(simpleGitStub.fetch, 'origin', branchName, match.func);

      assert.calledOnce(simpleGitStub.reset);
      assert.calledWithExactly(simpleGitStub.reset, ['--hard', 'origin/' + branchName], match.func);

      assert.calledThrice(simpleGitWraper);
      assert.calledWithExactly(simpleGitWraper, expectedConfigDir);

      assert.callCount(cliUiStub, 4);
      expect(cliUiStub).inOrder
        .to.have.been.calledWithExactly('ssh, check ssh-key')
        .subsequently.calledWithExactly('git, try to clone repo')
        .subsequently.calledWithExactly('git, reset changes')
        .subsequently.calledWithExactly('git, fetch updates');

      return done();
    });
  }));

  xit('should get an error, when error happens during reset changes process 2', sinon.test(function (done) {
    const branchName = 'branch';
    const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const githubUrl = `${repoUrl}#${branchName}`;
    const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
    const expectedConfigDir = `/home/user/Project/waffle-server-import-cli/repos/${expectedRelativeRepoFolder}/`;
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

    const gitFlow = proxyquire('../../../service/git-flow', {
      'simple-git': simpleGitWraper
    });

    const configDirStub = this.stub(gitFlow, 'configDir').returns(expectedConfigDir);

    return gitFlow.registerRepo(githubUrl, (error) => {
      expect(error).to.be.equal(expectedError);

      assert.calledOnce(configDirStub);
      assert.calledWithExactly(configDirStub, githubUrl);

      assert.calledOnce(shellStub);
      assert.calledWithExactly(shellStub, `ssh -T git@github.com`, {silent: true}, match.func);

      assert.calledTwice(simpleGitStub.silent);
      assert.calledWithExactly(simpleGitStub.silent, true);

      assert.calledOnce(simpleGitStub.clone);
      assert.calledWithExactly(simpleGitStub.clone, repoUrl, expectedConfigDir, [
        '-b',
        branchName
      ], match.func);

      assert.calledOnce(simpleGitStub.reset);
      assert.calledWithExactly(simpleGitStub.reset, ['--hard', 'origin/' + branchName], match.func);

      assert.notCalled(simpleGitStub.fetch);

      assert.calledTwice(simpleGitWraper);
      assert.calledWithExactly(simpleGitWraper, expectedConfigDir);

      assert.callCount(cliUiStub, 3);
      expect(cliUiStub).inOrder
        .to.have.been.calledWithExactly('ssh, check ssh-key')
        .subsequently.calledWithExactly('git, try to clone repo')
        .subsequently.calledWithExactly('git, reset changes');

      return done();
    });
  }));

  xit('should get an error, when error happens during fetching updates process 2', sinon.test(function (done) {
    const branchName = 'branch';
    const repoUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const githubUrl = `${repoUrl}#${branchName}`;
    const expectedRelativeRepoFolder = 'VS-work/ddf--ws-testing';
    const expectedConfigDir = `/home/user/Project/waffle-server-import-cli/repos/${expectedRelativeRepoFolder}/`;
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

    const gitFlow = proxyquire('../../../service/git-flow', {
      'simple-git': simpleGitWraper
    });

    const configDirStub = this.stub(gitFlow, 'configDir').returns(expectedConfigDir);

    return gitFlow.registerRepo(githubUrl, (error) => {
      expect(error).to.be.equal(expectedError);

      assert.calledOnce(configDirStub);
      assert.calledWithExactly(configDirStub, githubUrl);

      assert.calledOnce(shellStub);
      assert.calledWithExactly(shellStub, `ssh -T git@github.com`, {silent: true}, match.func);

      assert.calledThrice(simpleGitStub.silent);
      assert.calledWithExactly(simpleGitStub.silent, true);

      assert.calledOnce(simpleGitStub.clone);
      assert.calledWithExactly(simpleGitStub.clone, repoUrl, expectedConfigDir, [
        '-b',
        branchName
      ], match.func);

      assert.calledOnce(simpleGitStub.reset);
      assert.calledWithExactly(simpleGitStub.reset, ['--hard', 'origin/' + branchName], match.func);

      assert.calledOnce(simpleGitStub.fetch);
      assert.calledWithExactly(simpleGitStub.fetch, 'origin', branchName, match.func);

      assert.calledThrice(simpleGitWraper);
      assert.calledWithExactly(simpleGitWraper, expectedConfigDir);

      assert.callCount(cliUiStub, 4);
      expect(cliUiStub).inOrder
        .to.have.been.calledWithExactly('ssh, check ssh-key')
        .subsequently.calledWithExactly('git, try to clone repo')
        .subsequently.calledWithExactly('git, reset changes')
        .subsequently.calledWithExactly('git, fetch updates');

      return done();
    });
  }));
});