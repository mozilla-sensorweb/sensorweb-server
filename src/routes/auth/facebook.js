import express  from 'express';
import passport from 'passport';
import { Strategy } from 'passport-facebook';

import config   from '../../config';
import db       from '../../models/db';
import { finalizeAuth } from './utils';

const router = express.Router();

const callbackURL =
  `${config.get('publicHost')}/${config.get('version')}/auth/facebook/callback`;

passport.use(new Strategy(
  {
    clientID: config.get('facebook.clientID'),
    clientSecret: config.get('facebook.clientSecret'),
    callbackURL,
    enableProof: true,
  },
  function(accessToken, refreshToken, profile, cb) {
    db()
      .then(models => {
        const { AUTH_PROVIDER, authenticate } = models.Users;
        return authenticate(AUTH_PROVIDER, profile.id);
      })
      .then(
        userInfo => cb(null, userInfo),
        err => cb(err)
      );
  }
));

router.get('/', passport.authenticate('facebook', { session: false }));
router.get(
  '/callback',
  passport.authenticate('facebook', { failureRedirect: '/', session: false }),
  finalizeAuth
);

export default router;