/**
 * HTTP API for API clients management.
 *
 * Since we are currently only targeting a very limited number of API clients
 * (likely one for now) and we are not going to have a public registration form
 * for 3rd party devs for now, we keep it as simple as possible, storing only
 * the name of the API client, the API key and API secret.
 */

import express from 'express';

import clients from '../models/clients';

let router = express.Router();

// Create a new API client.
router.post('/', (req, res) => {
  // Required params: name
  // XXX We will probably require redirect url for signin/signup flow.
  req.checkBody('name', 'missing required parameter').notEmpty();

  const errors = req.validationErrors();
  if (errors) {
    // XXX proper error format.
    return res.status(400).send('Errors: ' + JSON.stringify(errors));
  }

  clients.create(req.body.name).then(client => {
    res.status(201).send(client);
  }).catch(error => {
    // XXX proper error format.
    res.status(500).send(error);
  });
});

// Get the list of registered API clients.
router.get('/', (req, res) => {
  clients.getAll().then(clients => {
    res.status(200).send(clients);
  }).catch(error => {
    // XXX proper error format.
    res.status(500).send(error);
  })
});

// Remove a registered API client.
router.delete('/:key', (req, res) => {
  // Required params: name
  // XXX We will probably require redirect url for signin/signup flow.
  req.checkParams('key', 'missing required parameter').notEmpty();

  const errors = req.validationErrors();
  if (errors) {
    // XXX proper error format.
    return res.status(400).send('Errors: ' + JSON.stringify(errors));
  }

  res.status(204).send();
});

export default router;
