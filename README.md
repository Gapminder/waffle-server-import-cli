# Waffle Server import CLI

```bash
    git clone git@github.com:valor-software/waffle-server-import-cli.git
    cd waffle-server-import-cli
    npm install
```

```bash
    # Terminal 1
    npm run server
```

```bash
    # Terminal 2
    npm run cli
```

==============================================================================

## Flow

### Start with Authentification

| Step | Choice |
|:---|:---|
| Authentification, Login       | Enter |
| Authentification, Password    | Enter |

### Import Repo 1

| Step | Choice |
|:---|:---|
| Choose Flow                                   | Import DataSet |
| List of DataSet Repositories (github.com)     | git@github...world-stub-1.git |

### Import Repo 2

| Step | Choice |
|:---|:---|
| Choose Flow                                   | Import DataSet                |
| List of DataSet Repositories (github.com)     | git@github...world-stub-2.git |

### Update Repo 1 :: diff 1 vs 2

| Step | Choice |
|:---|:---|
| Choose Flow                                   | Update DataSet |
| List of DataSet Repositories (github.com)     | git@github...world-stub-1.git |
| Git commit, state FROM                        | aafed7d ... dataset 1 (version 1) |
| Git commit, state TO                          | 5f88ae3 ... dataset 1 (version 2) |

### Update Repo 1 :: diff 2 vs 3

| Step | Choice |
|:---|:---|
| Choose Flow                                   | Update DataSet |
| List of DataSet Repositories (github.com)     | git@github...world-stub-1.git |
| Git commit, state FROM                        | 5f88ae3 ... dataset 1 (version 2) |
| Git commit, state TO                          | 5412b8b ... dataset 1 (version 3) |

### Update Repo 2 :: diff 1 vs 2

| Step | Choice |
|:---|:---|
| Choose Flow                                   | Update DataSet |
| List of DataSet Repositories (github.com)     | git@github...world-stub-2.git |
| Git commit, state FROM                        | e4eaa8e ... dataset 2 (version 1) |
| Git commit, state TO                          | a7f2d9d ... dataset 2 (version 2) |

### Update Repo 2 :: diff 2 vs 3

| Step | Choice |
|:---|:---|
| Choose Flow                                   | Update DataSet |
| List of DataSet Repositories (github.com)     | git@github...world-stub-2.git |
| Git commit, state FROM                        | a7f2d9d ... dataset 2 (version 2) |
| Git commit, state TO                          | 7d034e3 ... dataset 2 (version 3) |

### Results Overview

| Step | Choice |
|:---|:---|
| Choose Flow                                   | Results Overview |
| Choose Flow                                   | Exit |

==============================================================================

## TODO :: Update WS Routes

| Line | Path | Change |
|:---|:---|:---|
| 61:  | /steps/flow-import-dataset-choose.js    | WS_IMPORT |
| 337: | /steps/flow-update-dataset-hash-to.js   | WS_UPDATE |
| 105: | /steps/choose-flow.js                   | WS_PRESTORED_QUERY |
