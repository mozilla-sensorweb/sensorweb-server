import express  from 'express';

import passport from 'passport';
import { BasicStrategy } from 'passport-http';

import db       from '../../models/db';
import { finalizeAuth } from './utils';

passport.use(new BasicStrategy(
  (username, password, done) => {
    db().then(models => {
      const { BASIC, authenticate } = models.Users;
      return authenticate(BASIC, { username, password });
    }).then(
      userInfo => done(null, userInfo),
      err => done(err)
    );
  }
));

const router = express.Router();

router.post('/',
  passport.authenticate('basic', { session: false }),
  finalizeAuth
);

export default router;
