import btoa     from 'btoa';
import express  from 'express';
import jwt      from 'jsonwebtoken';

import config   from '../config';

let router = express.Router();

router.post('/auth', (req, res) => {
  if (!req.headers || !req.headers.authorization) {
    return res.sendStatus(401);
  }

  // For now we only accept basic authentication and only for the
  // admin user.
  const pass = req.headers.authorization.substr('Basic '.length);

  if (btoa('admin:' + config.get('adminPass')) !== pass) {
    return res.sendStatus(401);
  }

  const token = jwt.sign({
    id: 'admin',
    scope: 'admin'
  }, config.get('adminSessionSecret'));

  res.status(201).json({ token });
});

export default router;
