import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import {DatasetImportStep} from './import/dataset-choose-import';
import {RegisterRepositoryStep} from './register-repository';
import {DefaultStep} from './step';
import {DatasetUpdateStep} from './update/dataset-choose-update';

export class ChooseFlowStep extends DefaultStep {
    private registerRepositoryChoice = {
        name: 'Register Repository',
        value: 'register-repository'
    };

    private datasetChooseImportChoice = {
        name: 'Import DataSet',
        value: 'dataset-choose-import'
    };

    private datasetChooseUpdateChoice = {
        name: 'Update DataSet',
        value: 'dataset-choose-update'
    };

    private exitChoice = {
        name: 'Exit',
        value: 'exit'
    };

    public question: any = {
        name: 'choose-flow',
        type: 'list',
        message: 'Choose Flow',
        default: 1
    };
    public choosenStep: any;

    constructor(data: any) {
        super(data);
    }

    public choices(): any[] {
        return [
            this.registerRepositoryChoice,
            this.datasetChooseImportChoice,
            this.datasetChooseUpdateChoice,
            new inquirer.Separator(),
            this.exitChoice
        ];
    }

    public run(): void {
        const self = this;
        const question = Object.assign({choices: self.choices()}, self.question);

        inquirer.prompt(question).then((answers: any) => {
            const answer: string | boolean = _.get(answers, question.name, '');
            self.choosenStep = _.find(question.choices, {'name': answer});

            if (answer === self.registerRepositoryChoice.value) {
                const registerRepository = new RegisterRepositoryStep(self.data);
                registerRepository.run();
            } else if (answer === self.datasetChooseImportChoice.value) {
                const datasetChooseImport = new DatasetImportStep(self.data);
                datasetChooseImport.run();
            } else if (answer === self.datasetChooseUpdateChoice.value) {
                const datasetChooseUpdate = new DatasetUpdateStep(self.data);
                datasetChooseUpdate.run();
            }
        });
    }
}