import * as inquirer from 'inquirer';
import {WsChooseStep} from './ws-choose';
import {defaultChoices, backStep} from './default-choices';
import {AuthenticationLoginStep} from './authentication-login';
import {DefaultStep} from './step';
import * as _ from 'lodash';

export class WsListChooseStep extends DefaultStep {
    private loadedChoices: any[];
    private choosenWs: any;

    public question: any = {
        name: 'ws-list-choose',
        type: 'list',
        message: 'Select Waffle Server Endpoint'
    };

    constructor(data: any) {
        super(data);
    }

    public choices(): any[] {
        this.loadedChoices = require('../config/waffle-server.json');

        return this.loadedChoices.concat(defaultChoices);
    }

    public run():void {
        const self = this;
        const question = Object.assign({choices: self.choices()}, self.question);

        inquirer.prompt(question).then((answers: any) => {
            const answer = _.get(answers, self.question.name, false);

            switch(answer) {
                case backStep.value:
                    const wsChoose = new WsChooseStep();
                    wsChoose.run();
                    break;
                default:
                    self.choosenWs = _.find(self.loadedChoices, {'name': answer});

                    const authenticationLogin = new AuthenticationLoginStep({'ws-host': self.choosenWs.url});
                    authenticationLogin.run();
                    break;
            }
        });
    }
}