/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import express from 'express';
import db from '../models/db';
import { ApiError, ERRNO_INTERNAL_ERROR, INTERNAL_ERROR } from '../errors';

const router = express.Router();

// Return the list of allowed permissions.
router.get('/', (req, res) => {
  db()
    .then(models => models.Permissions.findAll())
    .then(permissions => {
      res.status(200).json({
        permissions: permissions.map(permission => permission.name)
      });
    }).catch(e => {
      ApiError(res, 500, ERRNO_INTERNAL_ERROR, INTERNAL_ERROR,
               JSON.stringify(e));
    });
});

export default router;
