import bodyParser       from 'body-parser';
import cors             from 'cors';
import express          from 'express';
import expressValidator from 'express-validator';
import logger           from 'morgan-body';
import path             from 'path';

import auth             from './middlewares/auth'

import config           from './config';

import clients          from './routes/clients';
import dockerflow       from './routes/dockerflow';
import authRouter       from './routes/auth';

import sensorthings     from './routes/sensorthings';

let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator({
  customValidators: {
    isArrayOfUrls: (value, options) => {
      const validator = expressValidator.validator;
      return Array.isArray(value) &&
             value.every(item => validator.isURL(item, options));
    }
  }
}));
app.use(bodyParser.json());

if (config.get('env') !== 'test' || process.env.FORCE_OUTPUT) {
  logger(app);
}

app.use(cors());

app.use('/', dockerflow);

app.use('/', sensorthings);

const endpointPrefix = '/' + config.get('version');

app.use(endpointPrefix + '/clients', auth(['admin']), clients);
app.use(endpointPrefix + '/auth', authRouter);

const port = config.get('port');
app.listen(port, () => console.log(`Running on localhost:${port}`));

exports = module.exports = app;
