/**
 * This middleware handles endpoint authentication. Endpoint authentication
 * is done through a signed JWT expected as value of the 'Authorization' header
 * or the 'authToken' query parameter. This JWT can be signed by two
 * different authorities:
 *
 * 1. A registered API client.
 * 2. The API server.
 *
 * Each of these authorities will have a different secret.
 *
 * Clients may obtain authorization tokens:
 *
 * 1. On their behalf.
 * 2. On behalf of an user.
 * 3. On behalf of a device.
 *
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

export const SIGNED_BY_CLIENT = 'clientSigned';
export const SIGNED_BY_SERVER = 'serverSigned';

export default (endpointScopes, signedBy) => {
  // Check that we specified who we expect to be the signer of the token
  // being verified.
  if (![SIGNED_BY_CLIENT, SIGNED_BY_SERVER].includes(signedBy)) {
    throw new Error('Invalid token signature author');
  }

  // Check that the required scope is a registered permission.
  const permissions = config.get('permissions');
  if (endpointScopes &&
      !endpointScopes.every(scope => permissions.includes(scope))) {
    throw new Error(`Invalid permission found in "${endpointScopes}"`);
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

    // *All* auth tokens must have at least a clientKey in its payload.
    // If this is a client signed token, we'll use the client identifier
    // to obtain the client's secret to verify the token's signature.
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.clientKey || !decoded.scopes) {
      return unauthorized(res);
    }

    db().then(({ Clients, Users, Permissions }) => {
      if (!decoded.userId) {
        return Promise.resolve({ Clients, Permissions });
      }

      // If this token was obtained on behalf of an user, we need to check
      // that the user is still valid.
      return Users.findById(decoded.userId).then(user => {
        if (!user) {
          throw new Error();
        }
        req.userId = user.id;
        return { Clients, Permissions };
      });
    }).then(({ Clients, Permissions }) => {
      // Every token belongs to a client and each client has its own
      // identifier. We need to verify that the client owning this token is
      // still a valid client.
      return Clients.findById(decoded.clientKey, { include: Permissions});
    }).then(client => {
      // The client must exist.
      if (!client) {
        return unauthorized(res);
      }

      decoded.scopes = Array.isArray(decoded.scopes) ? decoded.scopes
                                                     : [decoded.scopes];

      const permissions = client.Permissions.map(permission => {
        return permission.name;
      });

      // Check that the token has a scope allowed for this client and
      // that the required endpoint scopes are included in the token.
      if (!decoded.scopes.every(scope => permissions.includes(scope)) ||
          !endpointScopes.every(scope => decoded.scopes.includes(scope))) {
        return unauthorized(res);
      }

      // We expect to get tokens signed with different secrets.
      const secret = signedBy === SIGNED_BY_CLIENT ?
                     client.secret :
                     config.get('sessionSecret');

      // Verify JWT signature.
      jwt.verify(token, secret, error => {
        if (error) {
          return unauthorized(res);
        }

        req.scopes = decoded.scopes;
        req.client = client;
        req.authPayload = decoded;

        next();
      });
    }).catch(() => {
      unauthorized(res);
    });
  };
};
