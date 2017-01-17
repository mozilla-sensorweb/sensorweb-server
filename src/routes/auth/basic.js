import express  from 'express';

import passport from 'passport';
import { BasicStrategy } from 'passport-http';

import db       from '../../models/db';
import { finalizeAuth } from './utils';
import { ApiError, UNAUTHORIZED, ERRNO_UNAUTHORIZED } from '../../errors';

passport.use(new BasicStrategy(
  (username, password, done) => {
    db().then(models => {
      const { BASIC, authenticate } = models.Users;
      return authenticate(BASIC, { username, password });
    }).then(
      userInfo => done(null, userInfo),
      err => {
        if (err.message === UNAUTHORIZED) {
          done(null, false);
          return;
        }
        done(err);
      }
    );
  }
));

const router = express.Router();

router.post('/',
  (req, res, next) => {
    passport.authenticate(
      'basic',
      (err, user, _info) => {
        if (err) {
          return next(err);
        }

        if (!user) {
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
