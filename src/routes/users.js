import express  from 'express';

import config   from '../config';
import db       from '../models/db';
import {
  ApiError,
  ERRNO_UNAUTHORIZED,
  UNAUTHORIZED
} from '../errors';

let router = express.Router();

router.post('/auth', (req, res) => {
  if (!req.headers || !req.headers.authorization) {
    ApiError(res, 401, ERRNO_UNAUTHORIZED, UNAUTHORIZED);
    return;
  }

  db().then(models => {
    const { BASIC, authenticate } = models.Users;

    // For now we only accept basic authentication and only for the
    // admin user.
    const pass = req.headers.authorization.substr('Basic '.length);

    authenticate(BASIC, pass).then(token => {
      res.status(201).json({ token });
    }).catch(error => {
      ApiError(res, 401, ERRNO_UNAUTHORIZED, UNAUTHORIZED);
    });
  });
});

export default router;
