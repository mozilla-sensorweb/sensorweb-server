import express  from 'express';
import session  from 'express-session';
import SequelizeStoreFactory from 'connect-session-sequelize';

import basic  from './basic';
import facebook from './facebook';

import config from '../../config';
import { sequelize } from '../../models/db';

import auth from '../../middlewares/auth'
import { SIGNED_BY_CLIENT } from '../../middlewares/auth';

const router = express.Router();

// We don't need the session handling for Basic authentication, that's why we
// configure it here before inserting the session middleware.
router.use('/basic', auth([], SIGNED_BY_CLIENT), basic);

// initalize sequelize with session store
const SequelizeStore = SequelizeStoreFactory(session.Store);
const isProduction = process.env.NODE_ENV === 'production';
router.use(session({
  secret: config.get('userAuth.sessionSecret'),
  store: new SequelizeStore({
    db: sequelize
  }),
  cookie: {
    path: `/${config.get('version')}/auth`,
    secure: config.get('userAuth.cookieSecure'),
  },
  name: 'connect.sid.auth',
  resave: false,
  saveUninitialized: false,
}));

if (config.get('userAuth.facebook.clientID')) {
  router.use('/facebook', facebook);
} else {
  console.log(
    'No Facebook configuration, so not loading Facebook login endpoint'
  );
}

export default router;
