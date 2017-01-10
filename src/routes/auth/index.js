import express  from 'express';

import basic    from './basic';
import facebook from './facebook';

import config   from '../../config';
import db       from '../../models/db';
import auth     from '../../middlewares/auth';
import { ApiError, FORBIDDEN, ERRNO_FORBIDDEN } from '../errors';

const router = express.Router();

router.use('/basic', basic);

// for all other login mechanisms, we need a "client" JWT.
router.use(auth(['client']));
router.use((req, res, next) => {
  // check existing client
  db()
    .then(({ Clients }) => Clients.findById(req.user.id))
    .then(client => {
      if (client) {
        req.user.client = client;
        return next();
      }

      return ApiError(res, 403, ERRNO_FORBIDDEN, FORBIDDEN);
    });
});

if (config.get('facebook.clientID')) {
  router.use('/facebook', facebook);
}

export default router;
