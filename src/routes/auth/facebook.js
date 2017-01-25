import express      from 'express';
import passport     from 'passport';
import { Strategy } from 'passport-facebook';

import config       from '../../config';
import db           from '../../models/db';
import auth         from '../../middlewares/auth';
import finalizeAuth from './finalize_auth';
import {
  ApiError,
  BAD_REQUEST, ERRNO_BAD_REQUEST,
  FORBIDDEN, ERRNO_FORBIDDEN,
  UNAUTHORIZED, ERRNO_UNAUTHORIZED,
} from '../../errors';

const router = express.Router();

const callbackURL =
  `${config.get('publicHost')}/${config.get('version')}/auth/facebook/callback`;

passport.use(new Strategy(
  {
    clientID: config.get('userAuth.facebook.clientID'),
    clientSecret: config.get('userAuth.facebook.clientSecret'),
    callbackURL,
    passReqToCallback: true,
    enableProof: true,
    state: true,
  },
  function(req, accessToken, refreshToken, profile, cb) {
    db().then(models => {
      const { AUTH_PROVIDER, authenticate } = models.Users;
      return authenticate(
        AUTH_PROVIDER,
        {
          opaqueId: profile.id,
          provider: 'facebook',
          clientKey: req.session.clientKey,
        }
      );
    }).then(
      userInfo => cb(null, userInfo),
      err => cb(err)
    );
  }
));

function checkClientExists(req, res, next) {
  db().then(({ Clients }) =>
    Clients.findById(req.clientId, { attributes: { exclude: ['secret'] }})
  ).then(client => {
    if (client) {
      req.client = client;
      return next();
    }

    return ApiError(res, 403, ERRNO_FORBIDDEN, FORBIDDEN);
  });
}

function checkHasValidSession(req, res, next) {
  if (!req.session.valid) {
    return ApiError(res, 403, ERRNO_FORBIDDEN, FORBIDDEN);
  }

  return next();
}

router.get('/',
  auth(['client']),
  checkClientExists,
  (req, res, next) => {
    const client = req.client;
    const { redirectUrl, failureUrl } = req.authPayload;

    const authRedirectUrls = client.authRedirectUrls || [];
    const authFailureRedirectUrls = client.authFailureRedirectUrls || [];

    if (!authRedirectUrls.includes(redirectUrl) ||
        (failureUrl && !authFailureRedirectUrls.includes(failureUrl))) {
      return ApiError(
        res, 400, ERRNO_BAD_REQUEST, BAD_REQUEST,
        'The redirect and failure URLs must be declared in your account'
      );
    }

    req.session.valid = true;
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
  (req, res, next) => {
    passport.authenticate(
      'facebook',
      // Using the callback is the only way to customize how to respond to a
      // failure. Otherwise it's always a 401 without a body.
      (err, user, _info) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          if (req.session.failureUrl) {
            return res.redirect(req.session.failureUrl);
          }

          return ApiError(res, 401, ERRNO_UNAUTHORIZED, UNAUTHORIZED);
        }

        req.user = user;
        return next();
      }
    )(req, res, next);
  },
  finalizeAuth
);

export default router;
