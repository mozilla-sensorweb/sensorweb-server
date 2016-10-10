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

import proxy  from 'express-http-proxy';

import config from '../config';

export default proxy(config.get('sandboxServer'), {
  filter: (req, res) => {
    // The paths listed in the array are not handled by the proxy.
    if (['/', '/clients', '/users'].indexOf(req.path) === -1) {
      return true;
    }
  },
  decorateRequest: (proxyReq, originalReq) => {
    // Add SensorUp auth header.
    proxyReq.headers['St-P-Access-Token'] = config.get('sandboxToken');

    proxyReq.path = config.get('sandboxPath') + proxyReq.path;

    console.log('Proxified request', proxyReq);

    return proxyReq;
  }
});
