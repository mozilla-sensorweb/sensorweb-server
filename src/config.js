import convict from 'convict';
import fs      from 'fs';
import path    from 'path';

const conf = convict({
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
  version: {
    doc: 'API version.',
    format: Number,
    default: 1
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
