import bodyParser       from 'body-parser';
import cors             from 'cors';
import express          from 'express';
import expressValidator from 'express-validator';
import logger           from 'morgan-body';
import path             from 'path';

import auth             from './middlewares/auth'

import config           from './config';

import base             from './routes/base';
import clients          from './routes/clients';
import users            from './routes/users';

import sensorup         from './utils/sensorup';

let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(bodyParser.json());

if (config.get('env') !== 'test') {
  logger(app);
}

app.use(cors());

const endpointPrefix = '/api/v' + config.get('version');

// SensorUp's sandbox.
// We use this sandbox until we have our own implementation of the
// SensorThings API in place.
app.use(endpointPrefix + '/', sensorup);

app.use(endpointPrefix + '/clients', auth(['admin']), clients);
app.use(endpointPrefix + '/users', users);

// SensorThings API endpoints.
app.use(endpointPrefix + '/', base);

app.listen(8080, () => console.log('Running on localhost:8080'));

exports = module.exports = app;
