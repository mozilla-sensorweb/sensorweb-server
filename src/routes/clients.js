/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * HTTP API for API clients management.
 */

import express from 'express';

import db      from '../models/db';
import {
  ApiError,
  BAD_REQUEST,
  FORBIDDEN,
  ERRNO_BAD_REQUEST,
  ERRNO_FORBIDDEN,
  ERRNO_INTERNAL_ERROR,
  ERRNO_INVALID_API_CLIENT_NAME,
  ERRNO_INVALID_API_CLIENT_REDIRECT_URL,
  INTERNAL_ERROR,
  modelErrors,
  RECORD_ALREADY_EXISTS
} from '../errors';

let router = express.Router();

// Create a new API client.
router.post('/', (req, res) => {
  // Required params: name
  req.checkBody('name', 'missing or invalid required "name" parameter')
     .notEmpty();

  if (req.body.authRedirectUrls) {
    req.checkBody('authRedirectUrls', 'invalid "authRedirectUrls"')
       .isArrayOfUrls({ require_valid_protocol: true });
  }

  if (req.body.authFailureRedirectUrls) {
    // It makes no sense to handle only the error case of an user
    // authentication flow, so we explicitly forbid setting
    // authFailureRedirectUrls if authRedirectUrls is not present.
    if (!req.body.authRedirectUrls) {
      return ApiError(res, 400, ERRNO_INVALID_API_CLIENT_REDIRECT_URL,
                      BAD_REQUEST);
    }

    req.checkBody('authFailureRedirectUrls',
                  'invalid "authFailureRedirectUrls"')
       .isArrayOfUrls({ require_valid_protocol: true });
  }

  const error = req.validationErrors()[0];
  if (error) {
    let errno;
    switch (error.param) {
      case 'authRedirectUrls':
      case 'authFailureRedirectUrls':
        errno = ERRNO_INVALID_API_CLIENT_REDIRECT_URL;
        break;
      case 'name':
        errno = ERRNO_INVALID_API_CLIENT_NAME;
        break;
      default:
        errno = ERRNO_BAD_REQUEST;
    }
    return ApiError(res, 400, errno, BAD_REQUEST);
  }

  db().then(models => {
    models.Clients.create(req.body).then(client => {
      res.status(201).send(client);
    }).catch(error => {
      if (error.name && error.name === modelErrors[RECORD_ALREADY_EXISTS]) {
        return ApiError(res, 403, ERRNO_FORBIDDEN, FORBIDDEN);
      }
      ApiError(res, 500, ERRNO_INTERNAL_ERROR, INTERNAL_ERROR);
    });
  });
});

// Get the list of registered API clients.
router.get('/', (req, res) => {
  db().then(models => {
    models.Clients.findAll({
      attributes: ['key', 'name', 'authRedirectUrls',
                   'authFailureRedirectUrls']
    }).then(clients => {
      res.status(200).send(clients);
    }).catch(error => {
      ApiError(res, 500, ERRNO_INTERNAL_ERROR, INTERNAL_ERROR);
    });
  });
});

// Remove a registered API client.
router.delete('/:key', (req, res) => {
  const key = req.params.key;
  if (!key) {
    return res.status(204).send();
  }
  db().then(models => {
    models.Clients.destroy({
      where: {
        key
      }
    }).then(() => {
      res.status(204).send();
    }).catch(() => {
      res.status(204).send();
    });
  });
});

export default router;
