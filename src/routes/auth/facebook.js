import express  from 'express';
import passport from 'passport';
import { Strategy } from 'passport-facebook';

import config   from '../../config';
import db       from '../../models/db';
import { finalizeAuth } from './utils';
import { ApiError, BAD_REQUEST, ERRNO_BAD_REQUEST } from '../errors';

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
        return authenticate(
          AUTH_PROVIDER,
          { opaqueId: profile.id, provider: 'facebook' }
        );
      })
      .then(
        userInfo => cb(null, userInfo),
        err => cb(err)
      );
  }
));

router.get('/', (req, res, next) => {
  const client = req.user.client;
  const { redirectUrl, failureUrl } = req.query;

  if (!client.authRedirectUrls.includes(redirectUrl) ||
      !client.failureRedirectUrls.includes(failureUrl)) {
    return ApiError(
      res, 400, ERRNO_BAD_REQUEST, BAD_REQUEST,
      'Your redirect and failure URLs must be declared in your account'
    );
  }

  return passport.authenticate(
    'facebook',
    { session: false, state: {}, }
  )(req, res, next);
});

router.get(
  '/callback',
  passport.authenticate('facebook', { failureRedirect: '../', session: false }),
  finalizeAuth
);

export default router;
