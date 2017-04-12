import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import fetch from 'node-fetch';
import {ChooseFlowStep} from '../choose-flow';
import {ROUTE_WS_IMPORT} from '../config';
import {DefaultStep} from '../step';
import {DatasetImportStep} from './dataset-choose-import';

const gitFlow = require('../../service/git-flow');
const cliUi = require('../../service/cli-ui');

export class DatasetImportHashStep extends DefaultStep {
    public question: any = {
        name: 'dataset-choose-import-hash',
        type: 'list',
        message: 'List of Available Commits'
    };

    public choosenStep: any;
    private availableCommits: any[];

    private backChoice: any = {
        name: 'Back',
        value: 'back'
    };

    public constructor(data: any) {
        super(data);
    }

    public choices(): any {
        const self = this;

        return new Promise((resolve: Function, reject: Function) => {
            gitFlow.getCommitList(self.data.github, (error: any, availableCommits: any[]) => {
                cliUi.stop();

                if (error) {
                    return reject(error);
                }

                const formattedCommits: any[] = _.map(availableCommits, (commit: any) => ({
                    name: `${commit.hash} ${commit.message}`,
                    value: commit.hash
                })).reverse();
                self.availableCommits = formattedCommits;

                return resolve(formattedCommits.concat([
                    new inquirer.Separator(),
                    this.backChoice
                ]));
            });
        });
    }

    public run(): void {
        const self = this;

        self.choices()
            .then((choices: any[]) => {
                const question = Object.assign({choices}, self.question);

                return inquirer.prompt(question);
            })
            .then((answers: any) => {
                const answer: string | boolean = _.get(answers, self.question.name, '');
                self.choosenStep = _.find(self.availableCommits, {value: answer});

                if (answer === self.backChoice.value) {
                    const datasetImport = new DatasetImportStep(self.data);
                    datasetImport.run();
                } else {
                    return self.makeRequest();
                }
            })
            .catch((error: any) => {
                cliUi.stop().error(error.toString());

                const chooseFlow = new ChooseFlowStep(this.data);
                chooseFlow.run();
            });
    }

    private checkProgress(): any {
        const longPolling = require('../../service/request-polling');
        const data = {
            datasetName: gitFlow.getRepoName(this.data.github),
            wsSource: this.data['ws-host'],
            token: this.data.token
        };

        return new Promise((resolve: Function, reject: Function) => {
            longPolling.setTimeStart(100000);
            longPolling.checkDataSet(data, (result: any) => {
                if (!result.success) {
                    return reject(result);
                }

                cliUi.stop().success(result.message);

                return resolve(result);
            });
        })
            .then(() => {
                const chooseFlow = new ChooseFlowStep(this.data);
                chooseFlow.run();
            });

    }

    private makeRequest(): any {
        const self = this;
        const options = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                github: self.data.github,
                commit: self.choosenStep.value
            })
        };

        return fetch(`${self.data['ws-host']}${ROUTE_WS_IMPORT}?waffle-server-token=${self.data.token}`, options)
            .then((res: any) => {
                if (res.statusText === 'OK') {
                    return res.json();
                }

                throw new Error(res.statusText);
            })
            .then((res: any) => {
                if (!res.success) {
                    throw new Error(res.error || res.message);
                }

                return self.checkProgress();
            });
    }
}
