import express  from 'express';

import config   from '../config';
import {
  ApiError,
  ERRNO_UNAUTHORIZED,
  UNAUTHORIZED
} from '../errors';
import {
  authenticate,
  BASIC
} from '../models/users';

let router = express.Router();

router.post('/auth', (req, res) => {
  if (!req.headers || !req.headers.authorization) {
    return ApiError(res, 401, ERRNO_UNAUTHORIZED, UNAUTHORIZED);
  }

  // For now we only accept basic authentication and only for the
  // admin user.
  const pass = req.headers.authorization.substr('Basic '.length);

  authenticate(BASIC, pass).then(token => {
    res.status(201).json({ token });
  }).catch(error => {
    ApiError(res, 401, ERRNO_UNAUTHORIZED, UNAUTHORIZED);
  });
});

export default router;
