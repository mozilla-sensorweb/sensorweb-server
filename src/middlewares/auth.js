/**
 * Route middleware to verify session tokens.
 */

import jwt    from 'jsonwebtoken';
import config from '../config';

import {
  ApiError,
  ERRNO_UNAUTHORIZED,
  UNAUTHORIZED
} from '../errors';

function unauthorized(res) {
  ApiError(res, 401, ERRNO_UNAUTHORIZED, UNAUTHORIZED);
}

export default (scopes) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return unauthorized(res);
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return unauthorized(res);
    }

    // Because we expect to get tokens signed with different secrets, we first
    // need to get the owner of the token so we can get the appropriate secret.
    const decoded = jwt.decode(token);

    // For now we only allow authenticated requests from the admin user.
    // When this changes we will have a different secret per sensor and per
    // user.
    if (!decoded || !decoded.id || decoded.id !== 'admin') {
      return unauthorized(res);
    };

    const secret = config.get('adminSessionSecret');

    // Verify JWT signature.
    jwt.verify(token, secret, (error, decoded) => {
      if (error) {
        return unauthorized(res);
      }

      // XXX Get allowed scopes from sensor/user.

      // For now we only allow 'admin' scope.
      const validScopes = ['admin'].filter(
        scope => scopes.includes(scope)
      );

      if (!validScopes.length) {
        return unauthorized(res);
      }

      // If everything is good, save the decoded payload for use in other
      // routes.
      req.decoded = decoded;
      next();
    });
  };
};
