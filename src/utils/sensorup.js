/**
 * This is just a temporary utility.
 *
 * This proxy allows us to quickly expose a SensorThings API while we work on
 * our own open source implementation of this API. We will be using SensorUp's
 * sandbox.
 *
 * You will need to get an access token by creating an account at
 * https://pg.sensorup.com/playground.html
 *
 * Add the access token to your 'sandboxToken' config file entry.
 */

import proxy                   from 'express-http-proxy';

import config                  from '../config';
import { resourceEndpoints }   from '../routes/base';

export default proxy(config.get('sandboxServer'), {
  filter: (req, res) => {
    const matches = resourceEndpoints.filter(endpoint => {
      const regexp = new RegExp('^((?!' + endpoint + ').)*$');
      return req.path.match(regexp) == null;
    });

    // Only the paths listed in the resourcesEndpoints array are handled
    // by the proxy.
    if (matches.length) {
      return true;
    }
  },
  decorateRequest: (proxyReq, originalReq) => {
    // Add SensorUp auth header.
    proxyReq.headers['St-P-Access-Token'] = config.get('sandboxToken');

    proxyReq.path = config.get('sandboxPath') + proxyReq.path;

    //console.log('Proxified request', proxyReq);

    return proxyReq;
  }
});
