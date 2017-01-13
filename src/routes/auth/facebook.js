import express  from 'express';
import passport from 'passport';
import { Strategy } from 'passport-facebook';

import config   from '../../config';
import db       from '../../models/db';
import auth     from '../../middlewares/auth';
import { finalizeAuth } from './utils';
import {
  ApiError,
  BAD_REQUEST, ERRNO_BAD_REQUEST,
  FORBIDDEN, ERRNO_FORBIDDEN,
} from '../../errors';

const router = express.Router();

const callbackURL =
  `${config.get('publicHost')}/${config.get('version')}/auth/facebook/callback`;

passport.use(new Strategy(
  {
    clientID: config.get('facebook.clientID'),
    clientSecret: config.get('facebook.clientSecret'),
    callbackURL,
    passReqToCallback: true,
    enableProof: true,
    state: true,
  },
  function(req, accessToken, refreshToken, profile, cb) {
    db()
      .then(models => {
        const { AUTH_PROVIDER, authenticate } = models.Users;
        return authenticate(
          AUTH_PROVIDER,
          {
            opaqueId: profile.id,
            provider: 'facebook',
            ClientKey: req.session.clientKey,
          }
        );
      })
      .then(
        userInfo => cb(null, userInfo),
        err => cb(err)
      );
  }
));

function checkClientExists(req, res, next) {
  db()
    .then(({ Clients }) => Clients.findById(req.user.id))
    .then(client => {
      if (client) {
        req.user.client = client;
        return next();
      }

      return ApiError(res, 403, ERRNO_FORBIDDEN, FORBIDDEN);
    });
}

function checkHasValidSession(req, res, next) {
  if (!req.session) {
    return ApiError(res, 403, ERRNO_FORBIDDEN, FORBIDDEN);
  }

  return next();
}

router.get('/',
  auth(['client']),
  checkClientExists,
  (req, res, next) => {
    const client = req.user.client;
    const { redirectUrl, failureUrl } = req.query;

    if (!client.authRedirectUrls.includes(redirectUrl) ||
        !client.authFailureRedirectUrls.includes(failureUrl)) {
      return ApiError(
        res, 400, ERRNO_BAD_REQUEST, BAD_REQUEST,
        'The redirect and failure URLs must be declared in your account'
      );
    }

    req.session.redirectUrl = redirectUrl;
    req.session.failureUrl = failureUrl;
    req.session.clientKey = client.key;

    return passport.authenticate(
      'facebook', { session: false }
    )(req, res, next);
  }
);

router.get(
  '/callback',
  checkHasValidSession,
  passport.authenticate('facebook', { failureRedirect: '../', session: false }),
  finalizeAuth
);

export default router;
