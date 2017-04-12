import * as inquirer from 'inquirer';
import {WsListChooseStep} from './ws-list-choose';
import {DefaultStep} from './step';
import * as _ from 'lodash';

export class WsChooseStep extends DefaultStep {
    public question: any = {
        name: 'ws-choose',
        type: 'list',
        message: 'Waffle Server Endpoint',
        default: 0
    };

    constructor() {
        super();
    }

    public choices(): any[] {
        return [
            {
                name: 'Select from the List',
                value: 'ws-list-choose'
            },
            {
                name: 'Add new Endpoint',
                value: 'ws-list-add'
            },
            new inquirer.Separator(),
            {
                name: 'Exit',
                value: 'exit'
            }
        ]
    }

    public run(): void {
        const self = this;
        const question = Object.assign({choices: self.choices()}, self.question);

        inquirer.prompt(question).then((answers: any) => {
            const choises = self.choices();
            const answer = _.get(answers, self.question.name, false);

            switch(answer) {
                case _.first(choises).value:
                    const wsListChoose = new WsListChooseStep(answer);
                    wsListChoose.run();
                    break;
                case _.nth(choises, 1).value:
                // break;
                default:
                    break;
            }
        });
    }
}