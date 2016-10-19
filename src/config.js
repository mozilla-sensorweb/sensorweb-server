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

const password = value => {
  const adminPass = owasp.test(value);
  if (!adminPass.strong) {
    adminPass.errors.forEach(error => console.error(error));
    throw new Error('Admin pass is default or not strong enough.');
  }
};

const remoteSTConfig = {
  server: {
    doc: 'SensorThings remote API server',
    format: 'url',
    default: 'https://pg-api.sensorup.com'
  },
  path: {
    doc: 'SensorThings remote API path',
    default: '/st-playground/proxy/v1.0'
  },
  credentials: {
    header: {
      doc: 'SensorThings auth header name',
      format: avoidDefault,
      default: defaultValue
    },
    value: {
      doc: 'SensorThings auth header value',
      format: avoidDefault,
      default: defaultValue
    }
  }
};

const localSTConfig = {
  db: {
    host: {
      doc: 'SensorThings DB host',
      default: 'localhost'
    },
    port: {
      doc: 'SensorThings DB port',
      format: 'port',
      default: 5432
    },
    name: {
      doc: 'SensorThings DB name',
      format: avoidDefault,
      default: 'postgres'
    },
    user: {
      doc: 'SensorThings DB user',
      format: avoidDefault,
      default: defaultValue
    },
    password: {
      doc: 'SensorThings DB password',
      format: password,
      default: defaultValue
    }
  }
};

let commonConf = {
  adminPass: {
    doc: 'The password for the admin user. Follow OWASP guidelines for passwords',
    format: password,
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
  sensorthings: {},
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
};

let conf = convict(commonConf);

// Handle configuration files. You can specify a CSV list of configuration
// files to process, which will be overlayed in order, in the CONFIG_FILES
// environment variable. By default, the ../config/<env>.json file is loaded.
const envConfig = path.join(__dirname, '/../config', conf.get('env') + '.json');
let files = (envConfig + ',' + process.env.CONFIG_FILES)
    .split(',')
    .filter(fs.existsSync);

conf.loadFile(files);

const currentSTConfig = conf.get('sensorthings');

if (currentSTConfig.local) {
  commonConf.sensorthings.local = localSTConfig;
  conf = convict(commonConf);
} else if (currentSTConfig.remote) {
  commonConf.sensorthings.remote = remoteSTConfig;
  conf = convict(commonConf);
} else {
  throw new Error('SensorThings needs at least a local or remote configuration');
}

conf.loadFile(files);
conf.validate();

export default conf;
