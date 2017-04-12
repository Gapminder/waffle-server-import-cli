import * as inquirer from 'inquirer';
import {AuthenticationPasswordStep} from './authentication-password';
import {DefaultStep} from './step';
import {WS_LOGIN} from './config';

interface ChoosenWs {
    'ws-host'?: string
}

export class AuthenticationLoginStep extends DefaultStep {
    readonly emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    private login: string = '';

    public question: any = {
        name: 'authentication-login',
        type: 'input',
        message: 'Authentication, Login',
        validate: (input: string): any => {
            const self = this;

            console.log('WS_LOGIN', WS_LOGIN);

            return new Promise((resolve: Function, reject: Function) => {
                if (self.emailRegex.test(WS_LOGIN || input)) {
                    return resolve(true);
                }
                return resolve('The value isn\'t valid');
            });
        }
    };

    constructor(data: any) {
        super(data);
    }

    public choices(): any[] {
        return [];
    }

    public run():void {
        const self = this;
        inquirer.prompt(self.question).then((answer: any) => {
            self.login = WS_LOGIN || answer[self.question.name];
            // console.log({'ws-host': self.data['ws-host'], login: self.login});
            const authenticationPassword = new AuthenticationPasswordStep({'ws-host': self.data['ws-host'], login: self.login});
            authenticationPassword.run();
        });
    }
}