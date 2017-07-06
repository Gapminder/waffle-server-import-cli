'use strict';
const _ = require('lodash');

const messages = {
  answers: {
    ANSWER__WAFFLE_SERVER_ENDPOINT__SELECT_FROM_THE_LIST: /^\? Waffle Server Endpoint Select from the List/,
    ANSWER__WAFFLE_SERVER_SELECT_ENDPOINT__LOCAL: /^\? Select Waffle Server Endpoint local \(http\:\/\/localhost\:3000\)/,
    ANSWER__WAFFLE_SERVER_AUTHENTICATION_LOGIN__DEV_GAPMINDER_ORG: /^\? Authentication\, Login dev\@gapminder\.org/,
    ANSWER__WAFFLE_SERVER_AUTHENTICATION_LOGIN__EMPTY: /^\? Authentication\, Login $/,
    ANSWER__WAFFLE_SERVER_AUTHENTICATION_PASSWORD__123: /^\? Authentication\, Password \*\*\*/,
    ANSWER__WAFFLE_SERVER_AUTHENTICATION_PASSWORD__EMPTY: /^\? Authentication\, Password $/,

    ANSWER__WAFFLE_SERVER_DEFAULT_DATASET_LIST: /^\? Choose Default DataSet [a-z0-9_\/\-#]*$/,
    ANSWER__WAFFLE_SERVER_DEFAULT_DATASET_VERSIONS_LIST: /^Default DataSet was set \:\: open\-numbers\/ddf\-\-gapminder\-\-systema_globalis \/ aaaaaaa \/ 2017\-06\-27 00\:00\:00\s+\-+\s+\? Choose Default DataSet Version (aaaaaaa|bbbbbbb)\s+\(\d{4}\-\d{2}\-\d{2}\s+\d{2}\:\d{2}\:\d{2}\)\s+\? Choose Flow \(Use arrow keys\)/gm,

    ANSWER__ANYTHING: /^.*$/gm
  },
  questions: {
    WAFFLE_SERVER_ENDPOINT: /^\? Waffle Server Endpoint/,
    WAFFLE_SERVER_SELECT_ENDPOINT: /^\? Select Waffle Server Endpoint/,
    WAFFLE_SERVER_AUTHENTICATION_LOGIN: /^\? Authentication\, Login/,
    WAFFLE_SERVER_AUTHENTICATION_PASSWORD: /^\? Authentication\, Password/,
    WAFFLE_SERVER_CHOOSE_FLOW: /^\? Choose Flow \(Use arrow keys\)$/,
    WAFFLE_SERVER_CHOOSE_FLOW_DEFAULT_DATASET: /^\? Choose Flow Default DataSet/,
    WAFFLE_SERVER_SET_DEFAULT_DATASET: /^\? Choose Default DataSet/,

    WAFFLE_SERVER_DEFAULT_DATASET_EMPTY_LIST: /^\? Choose Default DataSet \(Use arrow keys\)\-*$/gm,
    WAFFLE_SERVER_DEFAULT_DATASET_LIST: /^\? Choose Default DataSet \(Use arrow keys\)\s+[\u276f]\s+([a-z0-9_\/\-#]*\s?)*\-*/gm,
    WAFFLE_SERVER_DEFAULT_DATASET_VERSIONS_LIST: /^\? Choose Default DataSet Version \(Use arrow keys\)\s+[\u276f]\s+((aaaaaaa|bbbbbbb)\s+\(\d{4}\-\d{2}\-\d{2}\s+\d{2}\:\d{2}\:\d{2}\)\s+)*/gm
  },
  errors: {
    ERROR__CONNECTION_REFUSED: /\-*\*\s+ERROR:\s+Error:\s+connect\s+ECONNREFUSED\s+\d{1,3}\.\d{1,3}.\d{1,3}.\d{1,3}:\d{2,4}\-*/gm,
    ERROR__NO_EMAIL_WAS_PROVIDED: /\-*\*\s+ERROR:\s+User\s+with\s+an\s+email\:\s+\'false\'\s+was\s+not\s+found\-*/gm,
    ERROR__NO_PASSWORD_WAS_PROVIDED: /\-*\*\s+ERROR:\s+Password\s+was\s+not\s+provided\-*/gm,
    ERROR__PASSWORD_IS_WRONG: /\-*\*\s+ERROR:\s+Password\s+is\s+wrong\-*/gm
  },
  others: {
    CLI_RESULT_DELIMITER: /^\-*$/
  }
};

module.exports.messages = messages;

module.exports.getAppropriateSteps = ({UP, DOWN, ENTER}) => {
  return {
    waffleServerEndpoint: [
      {
        keys: [ ENTER ],
        messageRegex: messages.questions.WAFFLE_SERVER_ENDPOINT
      }, {
        messageRegex: messages.answers.ANSWER__WAFFLE_SERVER_ENDPOINT__SELECT_FROM_THE_LIST
      }
    ],
    waffleServerSelectEndpoint: [
      {
        keys: [ ENTER ],
        messageRegex: messages.questions.WAFFLE_SERVER_SELECT_ENDPOINT
      }, {
        messageRegex: messages.answers.ANSWER__WAFFLE_SERVER_SELECT_ENDPOINT__LOCAL
      }
    ],
    validLogin: [
      {
        messageRegex: messages.questions.WAFFLE_SERVER_AUTHENTICATION_LOGIN
      },
      {
        keys: [ 'dev@gapminder.org', ENTER ],
        homotypic: true,
        messageRegex: messages.questions.WAFFLE_SERVER_AUTHENTICATION_LOGIN
      }
    ],
    answerLogin: [
      {
        messageRegex: messages.answers.ANSWER__WAFFLE_SERVER_AUTHENTICATION_LOGIN__DEV_GAPMINDER_ORG
      }
    ],
    emptyLogin: [
      {
        messageRegex: messages.questions.WAFFLE_SERVER_AUTHENTICATION_LOGIN
      },
      {
        keys: [ ENTER ],
        homotypic: true,
        messageRegex: messages.questions.WAFFLE_SERVER_AUTHENTICATION_LOGIN
      }
    ],
    validPassword: [
      {
        messageRegex: messages.questions.WAFFLE_SERVER_AUTHENTICATION_PASSWORD
      },
      {
        keys: [ '123', ENTER ],
        homotypic: true,
        messageRegex: messages.questions.WAFFLE_SERVER_AUTHENTICATION_PASSWORD
      }
    ],
    answerPassword: [
      {
        messageRegex: messages.answers.ANSWER__WAFFLE_SERVER_AUTHENTICATION_PASSWORD__123
      }
    ],
    emptyPassword: [
      {
        messageRegex: messages.questions.WAFFLE_SERVER_AUTHENTICATION_PASSWORD
      }
    ],
    chooseFlow: [
      {
        messageRegex: messages.questions.WAFFLE_SERVER_CHOOSE_FLOW
      }
    ],
    setDefaultDataset: [
      ...makeDefaultSteps(getKeys(8, DOWN)),
      {
        keys: [ ENTER ],
        messageRegex: messages.questions.WAFFLE_SERVER_CHOOSE_FLOW_DEFAULT_DATASET
      }
    ],
    delimiter: [
      {
        keys: [ ENTER ],
        messageRegex: messages.others.CLI_RESULT_DELIMITER
      }
    ],
    anything: [
      {
        messageRegex: messages.answers.ANSWER__ANYTHING
      }
    ]
  };

  function getKeys(times, key) {
    return _.times(times, _.constant(key));
  }

  function makeDefaultSteps(keys = [ENTER]) {

    return _.flatMap(keys, (key) => {
      return [
        {
          keys: [key],
          messageRegex: messages.answers.ANSWER__ANYTHING
        }, {
          messageRegex: messages.answers.ANSWER__ANYTHING
        }
      ];
    });
  }
};
