import * as inquirer from 'inquirer';
import fetch from 'node-fetch';
import {PASSWORD_REGEX, ROUTE_WS_AUTH, WS_PASSWORD} from './config';
import {DefaultStep} from './step';
import {ChooseFlowStep} from './choose-flow';

export class AuthenticationPasswordStep extends DefaultStep {
    private password: string = '';

    public question: any = {
        name: 'authentication-password',
        type: 'password',
        message: 'Authentication, Password',
        validate: (input: string): any => {
            const self = this;
            const currentPassword = WS_PASSWORD || input;

            return new Promise((resolve: Function, reject: Function) => {
                    if (PASSWORD_REGEX.test(currentPassword)) {
                        return resolve(true);
                    }
                    return reject('The value isn\'t valid');
                })
                .then(() => {
                    const options = {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            email: self.data.login,
                            password: currentPassword
                        })
                    };

                    return fetch(self.data['ws-host'] + ROUTE_WS_AUTH, options);
                })
                .then((res: any) => res.json())
                .then((res: any) => {
                    if (!res.success) {
                        throw new Error(res.error);
                    }
                    self.data.token = res.data.token;
                    self.data.password = currentPassword;
                    return true;
                })
                .catch(error => {
                    console.error(error);
                });
        }
    };

    constructor(data: any) {
        super(data);
    }

    public choices(): any[] {
        return [];
    }

    public run(): void {
        const self = this;

        inquirer.prompt(self.question).then(() => {
            const chooseFlow = new ChooseFlowStep(self.data);
            chooseFlow.run();
        });
    }
}
