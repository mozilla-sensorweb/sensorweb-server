import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import expressValidator from 'express-validator';
import logger from 'morgan-body';
import path from 'path';

import auth from './middlewares/auth'
import { SIGNED_BY_SERVER } from './middlewares/auth';
import config from './config';

import authRouter from './routes/auth';
import clients from './routes/clients';
import dockerflow from './routes/dockerflow';
import permissions from './routes/permissions';
import sensorthings from './routes/sensorthings';

let app = express();

app.set('trust proxy', config.get('behindProxy'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator({
  customValidators: {
    isArrayOfUrls: (value, options) => {
      const validator = expressValidator.validator;
      return Array.isArray(value) &&
             value.every(item => validator.isURL(item, options));
    },
    isArrayOfPermissions: (value) => {
      const permissions = config.get('permissions');
      return Array.isArray(value) &&
             value.every(item => permissions.indexOf(item) !== -1);
    }
  }
}));
app.use(bodyParser.json());

if (config.get('env') !== 'test' || process.env.FORCE_OUTPUT) {
  logger(app);
}

app.use(cors());

const endpointPrefix = '/' + config.get('version');

app.use('/', dockerflow);
app.use('/', sensorthings);

app.use(endpointPrefix + '/auth', authRouter);
app.use(endpointPrefix + '/clients', auth(['admin'], SIGNED_BY_SERVER), clients);
app.use(endpointPrefix + '/permissions', auth(['admin'], SIGNED_BY_SERVER),
        permissions);

const port = config.get('port');
app.listen(port, () => console.log(`Running on localhost:${port}`));

exports = module.exports = app;
