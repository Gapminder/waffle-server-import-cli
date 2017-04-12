import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import {ChooseFlowStep} from '../choose-flow';
import {DefaultStep} from '../step';
import {DatasetImportHashStep} from './dataset-choose-import-hash';

export class DatasetImportStep extends DefaultStep {
    public question: any = {
        name: 'dataset-choose-update',
        type: 'list',
        message: `List of DataSet Repositories (github.com, was loaded from Waffle Server)`
    };

    public choosenStep: any;
    private availableDatasets: any;

    private backChoice: any = {
        name: 'Back',
        value: 'back'
    };

    public constructor(data: any) {
        super(data);
    }

    public choices(): any[] {
        const self = this;
        self.availableDatasets = require('../../config/repositories.json');

        return _.map(self.availableDatasets, (dataset: any) => dataset.github).concat([
            new inquirer.Separator(),
            self.backChoice
        ]);
    }

    public run(): void {
        const self = this;
        const question = Object.assign({choices: self.choices()}, self.question);

        inquirer.prompt(question).then((answers: any) => {
            const answer: string | boolean = _.get(answers, question.name, false);
            self.choosenStep = _.find(self.availableDatasets, {github: answer});

            if (self.choosenStep) {
                const data = Object.assign({}, self.choosenStep, self.data);
                const importHash = new DatasetImportHashStep(data);
                importHash.run();
            } else {
                const chooseFlow = new ChooseFlowStep(self.data);
                chooseFlow.run();
            }
        });
    }
}
