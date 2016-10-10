import express  from 'express';

import config   from '../config';

const resources = {
  DATASTREAMS           : 'Datastreams',
  FEATURES_OF_INTEREST  : 'FeaturesOfInterest',
  HISTORICAL_LOCATIONS  : 'HistoricalLocations',
  LOCATIONS             : 'Locations',
  OBSERVATIONS          : 'Observations',
  SENSORS               : 'Sensors',
  THINGS                : 'Things'
};

exports.resources = resources;
Object.keys(resources).forEach(key => exports[key] = key);

let router = express.Router();

// Navigating to the base path will return a JSON array of the available
// SensorThings resource endpoints.
router.get('/', (req, res) => {
  const prepath = req.protocol + '://' + req.hostname + req.baseUrl + '/';

  const value = Object.keys(resources).map(key => {
    return {
      'name': resources[key],
      'url': prepath + resources[key]
    };
  });

  res.status(200).send({ value: value });
});

export default router;
