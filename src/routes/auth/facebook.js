import express  from 'express';
import passport from 'passport';
import Strategy from 'passport-facebook';

import config   from '../config';
import db       from '../models/db';

const router = express.Router();

passport.use(new Strategy({
  clientId: config.get('facebook.clientId'),
  clientSecret: config.get('facebook.clientSecret'),
  callbackURL:
    `${config.get('publicHost')}/${config.get('version')}/auth/facebook/callback}`,
}));

router.post('/', passport.authenticate('facebook'));
router.get(
  '/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.send('authenticated');
  }
);

export default router;
