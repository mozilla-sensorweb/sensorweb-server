/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import express from 'express';
import fs      from 'fs';

import {
  ApiError,
  ERRNO_INTERNAL_ERROR,
  ERRNO_RESOURCE_NOT_FOUND,
  INTERNAL_ERROR,
  NOT_FOUND
} from '../errors';

const versionFile = __dirname + '/../../version.json';

let router = express.Router();

router.get('/', (req, res) => {
  res.status(200).send('Hello');
});

const heartbeat = (req, res) => {
  fs.stat(versionFile, err => {
    if (err) {
      return ApiError(res, 500, ERRNO_INTERNAL_ERROR, INTERNAL_ERROR,
                      'Could not find version file');
    }
    res.status(200).send('OK');
  });
};

// For service monitoring to make sure the service is responding and normal.
router.get('/__heartbeat__', heartbeat);

// For load balancers to make sure the app is running.
router.get('/__lheartbeat__', heartbeat);

router.get('/__version__', (req, res) => {
  fs.stat(versionFile, err => {
    if (err) {
      return ApiError(res, 404, ERRNO_RESOURCE_NOT_FOUND, NOT_FOUND,
                      'Version data not found');
    }
    const json = fs.readFileSync(versionFile);
    res.status(200).send(JSON.parse(json));
  });
});

export default router;
