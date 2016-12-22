import express  from 'express';

import passport from 'passport';
import { BasicStrategy } from 'passport-http';

import jwt      from 'jsonwebtoken';

import config   from '../../config';
import db       from '../../models/db';

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
  (req, res) => {
    const token = jwt.sign(req.user, config.get('adminSessionSecret'));
    res.status(201).json({ token });
  }
);

export default router;
