import jwt      from 'jsonwebtoken';
import url      from 'url';

import config   from '../../config';

import {
  ApiError,
  ERRNO_UNAUTHORIZED,
  UNAUTHORIZED
} from '../../errors';

export default function finalizeAuth(req, res) {
  // XXX We will need these values for the multi-tenant and multi-user
  //     middlewares, but for now, let's just remove them here.
  //     Issues #75 and #76.
  const userId = req.userId;
  delete req.userId;
  const clientKey = req.client.key;
  delete req.client;
  const scopes = req.scopes && Array.isArray(req.scopes) ?
                req.scopes : [req.scopes];
  delete req.scopes;

  if (!clientKey || !scopes) {
    return ApiError(res, 401, ERRNO_UNAUTHORIZED, UNAUTHORIZED);
  }

  const token = jwt.sign({ clientKey, userId, scopes},
                         config.get('sessionSecret'));

  if (req.session && req.session.redirectUrl) {
    const redirectUrl = url.parse(req.session.redirectUrl, true);
    redirectUrl.query.token = token;
    req.session.destroy();
    res.redirect(url.format(redirectUrl));
    return;
  }

  res.status(200).json({ token });
}
