import {DefaultStep} from './step';
import * as inquirer from 'inquirer';
import {ChooseFlowStep} from './choose-flow';
import * as _ from 'lodash';

export class RegisterRepositoryStep extends DefaultStep {
    private backChoice = {
        name: 'Back',
        value: 'back'
    };

    public question: any = {
        'name': 'dataset-choose-update',
        'type': 'list',
        'message': `List of DataSet Repositories (github.com, was loaded from Waffle Server)`
    };

    public choosenStep: any;

    constructor(data: any) {
        super(data);
    }

    public choices(): any[] {
        return [
            new inquirer.Separator(),
            this.backChoice
        ];
    }

    public run():void {
        const self = this;
        const question = Object.assign({choices: self.choices()}, self.question);

        inquirer.prompt(question).then((answers: any) => {
            const answer: string | boolean = _.get(answers, question.name, '');
            self.choosenStep = _.find(question.choices, {'name': answer});

            if (answer === self.backChoice.value) {
                const chooseFlow = new ChooseFlowStep(self.data);
                chooseFlow.run();
            }
        });
    }
}