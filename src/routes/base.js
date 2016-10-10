import express  from 'express';

import config   from '../config';

const resourceEndpoints = [
  'Datastreams',
  'FeaturesOfInterest',
  'HistoricalLocations',
  'Locations',
  'Observations',
  'Sensors',
  'Things'
];

exports.resourceEndpoints = resourceEndpoints;

let router = express.Router();

// Navigating to the base path will return a JSON array of the available
// SensorThings resource endpoints.
router.get('/', (req, res) => {
  const prepath = req.protocol + '://' + req.hostname + req.baseUrl + '/';

  const value = resourceEndpoints.map(key => {
    return {
      'name'  : key,
      'url'   : prepath + key
    };
  });

  res.status(200).send({ value: value });
});

export default router;
