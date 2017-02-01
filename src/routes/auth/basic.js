import db from '../../models/db';
import express from 'express';
import finalizeAuth from './finalize_auth';
import { ApiError, UNAUTHORIZED, ERRNO_UNAUTHORIZED } from '../../errors';

const router = express.Router();

router.get('/', (req, res, next) => {
  const { username, password } = req.authPayload;
  if (!username || !password) {
    return ApiError(res, 401, ERRNO_UNAUTHORIZED, UNAUTHORIZED);
  }

  db().then(({ Users }) => {
    const { BASIC, authenticate } = Users;
    return authenticate(BASIC, { username, password });
  }).then(user => {
    req.userId = user.id;
    next();
  }).catch(() => {
    ApiError(res, 401, ERRNO_UNAUTHORIZED, UNAUTHORIZED);
  });
}, finalizeAuth);

export default router;
