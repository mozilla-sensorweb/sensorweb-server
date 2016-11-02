/**
 * HTTP API for API clients management.
 *
 * Since we are currently only targeting a very limited number of API clients
 * (likely one for now) and we are not going to have a public registration form
 * for 3rd party devs for now, we keep it as simple as possible, storing only
 * the name of the API client, the API key and API secret.
 */

import express from 'express';

import db      from '../models/db';
import {
  ApiError,
  BAD_REQUEST,
  FORBIDDEN,
  ERRNO_FORBIDDEN,
  ERRNO_INTERNAL_ERROR,
  ERRNO_INVALID_API_CLIENT_NAME,
  INTERNAL_ERROR,
  modelErrors,
  RECORD_ALREADY_EXISTS
} from '../errors';

let router = express.Router();

// Create a new API client.
router.post('/', (req, res) => {
  // Required params: name
  // XXX We will probably require redirect url for signin/signup flow.
  req.checkBody('name', 'missing or invalid required "name" parameter')
     .notEmpty();

  const errors = req.validationErrors();
  if (errors) {
    return ApiError(res, 400, ERRNO_INVALID_API_CLIENT_NAME, BAD_REQUEST);
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
      attributes: ['key', 'name']
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
