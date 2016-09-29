# SensorWeb server
[![License](https://img.shields.io/badge/license-MPL2-blue.svg)](https://raw.githubusercontent.com/fxbox/foxbox/master/LICENSE)
[![Build Status](https://travis-ci.org/mozilla-sensorweb/sensorweb-server.svg?branch=master)](https://travis-ci.org/mozilla-sensorweb/sensorweb-server)

# Usage
Before running the server, you will need to install all its dependencies via

```shell
npm install
```

The server requires two environment variables to run:
* ADMIN_PASS The password for the admin user. It should be a valid password as defined by the [OWASP Guidelines for enforcing secure passwords](https://www.owasp.org/index.php/Authentication_Cheat_Sheet#Implement_Proper_Password_Strength_Controls).
* JWT_SECRET A secret token or passphrase used to signed the admin session token.

Once all dependencies are installed run:

```shell
ADMIN_PASS=Whatever.00 JWT_SECRET=secretpassphrase npm start
```

The server should start running at http://localhost:8080
