/**
 * Route middleware to verify session tokens.
 */

import jwt    from 'jsonwebtoken';
import config from '../config';
import db     from '../models/db';

import {
  ApiError,
  ERRNO_UNAUTHORIZED,
  UNAUTHORIZED
} from '../errors';

function unauthorized(res) {
  ApiError(res, 401, ERRNO_UNAUTHORIZED, UNAUTHORIZED);
}

export default (scopes) => {
  // For now we only allow 'admin' scope.
  const validScopes = ['admin', 'client', 'user'].filter(
    scope => scopes.includes(scope)
  );

  if (!validScopes.length) {
    throw new Error(`No valid scope found in "${scopes}"`);
  }

  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    // User auth flows require to perform a redirection to the IdP auth
    // flow. Accepting the auth token as a query parameter as well allows
    // clients to initiate this redirection from browsers by sending a
    // GET request to any of our /auth/* endpoints dealing with user
    // authentication.
    const authQuery = req.query.authToken;

    if (!authHeader && !authQuery) {
      return unauthorized(res);
    }

    const token = authHeader ? authHeader.split('Bearer ')[1] : authQuery;
    if (!token) {
      return unauthorized(res);
    }

    // Because we expect to get tokens signed with different secrets, we first
    // need to get the owner of the token so we can get the appropriate secret.
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.id || !decoded.scope) {
      return unauthorized(res);
    }

    if (!validScopes.includes(decoded.scope)) {
      console.log('Error while authenticating, invalid scope', decoded);
      return unauthorized(res);
    }

    let secretPromise;
    switch(decoded.scope) {
      case 'client':
        secretPromise = db().then(({ Clients }) =>
          Clients.findById(decoded.id, { attributes: ['secret'] })
        ).then(client => client.secret);
        break;
      case 'user':
      case 'admin':
        secretPromise = Promise.resolve(config.get('adminSessionSecret'));
        break;
      default:
        // should not happen because we check this earlier
        next(new Error(`Unknown scope ${decoded.scope}`));
    }

    // Verify JWT signature.
    secretPromise.then(secret => {
      jwt.verify(token, secret, (error) => {
        if (error) {
          console.log('Error while verifying the token', error);
          return unauthorized(res);
        }

        // XXX s/id/clientId/g
        req.clientId = decoded.id;
        delete decoded.id;
        req.authPayload = decoded;

        // XXX Get rid of this. Kept only to keep user tokens working. Issue #68
        req[decoded.scope] = decoded.id;
        req.authScope = decoded.scope;

        return next();
      });
    }).catch(err => next(err || new Error('Unexpected error')));
  };
};
