import express  from 'express';
import session  from 'express-session';
import SequelizeStoreFactory from 'connect-session-sequelize';

import basic    from './basic';
import facebook from './facebook';

import config   from '../../config';
import { sequelize }       from '../../models/db';

const router = express.Router();

router.use('/basic', basic);

// initalize sequelize with session store
const SequelizeStore = SequelizeStoreFactory(session.Store);
const isProduction = process.env.NODE_ENV === 'production';
router.use(session({
  secret: 'keyboard cat',
  store: new SequelizeStore({
    db: sequelize
  }),
  cookie: {
    path: `/${config.get('version')}/auth`,
    secure: isProduction,
  },
  name: 'connect.sid.auth',
  proxy: isProduction, // TODO maybe better configure this in config
  resave: false,
  saveUninitialized: false,
}));

if (config.get('facebook.clientID')) {
  router.use('/facebook', facebook);
} else {
  console.log(
    'No Facebook configuration, so not loading Facebook login endpoint'
  );
}

export default router;
