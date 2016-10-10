import convict from 'convict';
import fs      from 'fs';
import owasp   from 'owasp-password-strength-test';
import path    from 'path';

const defaultValue = 'default';

const avoidDefault = value => {
  // convict does not allow config entries without defaults.
  if (value === defaultValue) {
    throw new Error('Do not use default secrets');
  }
};

const conf = convict({
  adminPass: {
    doc: 'The password for the admin user. Follow OWASP guidelines for passwords',
    format: value => {
      const adminPass = owasp.test(value);
      if (!adminPass.strong) {
        adminPass.errors.forEach(error => console.error(error));
        throw new Error('Admin pass is default or not strong enough.');
      }
    },
    default: 'invalid'
  },
  adminSessionSecret: {
    doc: 'Secret to sign admin session tokens',
    format: avoidDefault,
    default: defaultValue
  },
  env: {
    doc: 'The application environment.',
    format: ['dev', 'test', 'stage', 'prod'],
    default: 'dev',
    env: 'NODE_ENV'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 8080,
    env: 'PORT'
  },
  sandboxPath: {
    doc: 'SensorThings sandbox API path',
    default: '/st-playground/proxy/v1.0'
  },
  sandboxServer: {
    doc: 'SensorThings sandbox API server',
    format: 'url',
    default: 'https://pg-api.sensorup.com'
  },
  sandboxToken: {
    doc: 'SensorThings sandbox API credentials',
    format: avoidDefault,
    default: defaultValue
  },
  version: {
    doc: 'API version. We follow SensorThing\'s versioning format as described at http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#34',
    format: value => {
      const pattern = /^(\d+\.)?(\d)$/g;
      const match = pattern.exec(value);
      if (match === null) {
        throw new Error('Invalid version number');
      }
    },
    default: '1.0'
  }
});

// Handle configuration files. You can specify a CSV list of configuration
// files to process, which will be overlayed in order, in the CONFIG_FILES
// environment variable. By default, the ../config/<env>.json file is loaded.
const envConfig = path.join(__dirname, '/../config', conf.get('env') + '.json');
let files = (envConfig + ',' + process.env.CONFIG_FILES)
    .split(',')
    .filter(fs.existsSync);

conf.loadFile(files);
conf.validate();

export default conf;
