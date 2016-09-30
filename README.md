# SensorWeb server
[![License](https://img.shields.io/badge/license-MPL2-blue.svg)](https://raw.githubusercontent.com/fxbox/foxbox/master/LICENSE)
[![Build Status](https://travis-ci.org/mozilla-sensorweb/sensorweb-server.svg?branch=master)](https://travis-ci.org/mozilla-sensorweb/sensorweb-server)

# Usage
Before running the server, you will need to install all its dependencies via

```shell
npm install
```

The server requires some initial configuration before being able to run. You can create your configuration file in `config/{NODE_ENV}.json`. Take `config/sample.json` as a starting point for your config file.

Once all dependencies are installed and the config file is in place you can start the server by running:

```shell
npm start
```

The server should start running at http://localhost:8080

# Running the tests

```shell
npm run test-watch
```
