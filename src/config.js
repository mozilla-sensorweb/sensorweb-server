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

convict.addFormat({
  name: 'dbport',
  validate: val => (val === null || val >= 0 && val <= 65535),
  coerce: val => (val === null ? null : parseInt(val))
});

convict.addFormat({
  name: 'hex',
  validate: function(val) {
    if (/[^a-fA-F0-9]/.test(val)) {
      throw new Error('must be a hex key');
    }
  }
});

convict.addFormat({
  name: 'arrayOfStrings',
  validate: val => (
    Array.isArray(val) && val.every(item => typeof item === 'string')
  )
});

// Note: Alphabetically ordered, please.
const conf = convict({
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
  behindProxy: {
    doc: `Set this to true if the server runs behind a reverse proxy. This is
          especially important if the proxy implements HTTPS with
          userAuth.cookieSecure. Also with this Express will trust the
          X-Forwarded-For header. Set to 1 or auto if you're behind a proxy.`,
    default: false,
    // Format is "*" because otherwise convict infers it's a boolean from the
    // default value and will refuse 1 or "auto".
    format: '*',
  },
  db: {
    host: {
      doc: 'Hostname where PostgreSQL is running',
      default: 'localhost'
    },
    port: {
      doc: 'Port where PostgreSQL is running',
      format: 'dbport',
      default: 5432
    },
    name: {
      doc: 'Database name',
      default: 'sensorweb',
    },
    user: {
      doc: 'Database username',
      default: '',
    },
    password: {
      doc: 'Database password',
      default: '',
    }
  },
  env: {
    doc: 'The application environment.',
    format: ['dev', 'test', 'stage', 'prod', 'circleci'],
    default: 'dev',
    env: 'NODE_ENV'
  },
  // XXX Define list of scopes Issue #53
  permissions: {
    doc: 'List of allowed client permissions',
    format: 'arrayOfStrings',
    default: ['admin']
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 8080,
    env: 'PORT'
  },
  publicHost: {
    doc: 'Public host for this server, especially for auth callback'
  },
  sensorthings: {
    server: {
      doc: 'SensorThings remote API server',
      format: 'url',
      default: 'http://localhost'
    },
    path: {
      doc: 'SensorThings remote API path',
      default: defaultValue
    },
    credentials: {
      header: {
        doc: 'SensorThings auth header name',
        default: defaultValue
      },
      value: {
        doc: 'SensorThings auth header value',
        default: defaultValue
      }
    }
  },
  userAuth: {
    cookieSecure: {
      doc: `This configures whether the cookie should be set and sent for
            HTTPS only. This is important to set to 'true' if the application
            runs on HTTPS.`,
      default: false,
    },
    sessionSecret: {
      doc: 'This secret is used to sign session cookie',
      default: defaultValue,
      format: avoidDefault,
    },
    facebook: {
      clientId: {
        doc: 'Facebook clientId',
        format: 'nat'
      },
      clientSecret: {
        doc: 'Facebook clientSecret',
        format: 'hex'
      },
    },
  },
  version: {
    doc: `API version. We follow SensorThing\'s versioning format as described
          at http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#34`,
    format: value => {
      const pattern = /^v(\d+\.)?(\d)$/g;
      const match = pattern.exec(value);
      if (match === null) {
        throw new Error('Invalid version number');
      }
    },
    default: 'v1.0'
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
