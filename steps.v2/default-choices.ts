import * as inquirer from 'inquirer';

export const backStep:any = {
    name: 'Back',
    value: 'back'
};

export const defaultChoices = [
    new inquirer.Separator(),
    backStep
];
