# SensorWeb server
[![License](https://img.shields.io/badge/license-MPL2-blue.svg)](https://raw.githubusercontent.com/fxbox/foxbox/master/LICENSE)
[![Build Status](https://travis-ci.org/mozilla-sensorweb/sensorweb-server.svg?branch=master)](https://travis-ci.org/mozilla-sensorweb/sensorweb-server)
[![Coverage Status](https://coveralls.io/repos/github/mozilla-sensorweb/sensorweb-server/badge.svg)](https://coveralls.io/github/mozilla-sensorweb/sensorweb-server)

# Usage
Before running the server, you will need to install all its dependencies via

```shell
npm install
```

The server requires some initial configuration before being able to run.
You can create your configuration file in `config/{NODE_ENV}.json`.
Take `config/sample.json` as a starting point for your config file.

The server uses PostgreSQL as the database system, so make sure that you have it
installed and running on your machine. If you are on a Mac, you can try running
`scripts/bootstrap-mac.sh` to install and launch PostgreSQL with the default
configuration.

Once all dependencies are installed and the config file is in place you can
start the server by running:

```shell
npm start
```

The server should start running at http://localhost:8080

# Running the tests

```shell
npm run test-watch
```
