# Waffle Server import CLI

```bash
    git clone git@github.com:valor-software/waffle-server-import-cli.git
    cd waffle-server-import-cli
    npm install
```

```bash
    # Terminal 2
    npm start
```

Note: For local usage Waffle Server should be launched on `http://localhost:3000`

Repositories List `repositories.json`, Array of Objects:
```
  {
    "github": "git@github.com:path",
    "folder": "git-repo-name"
  }
```

Waffle Server List `waffle-server.json`, Array of Objects:
```
  {
    "url": "http(s)://host:port",
    "name": "any definition"
  }
```