/**
 *
 * This module decides, based on configuration, if we mount our own
 * Sensorthings API (through sensortings module) or proxy to an external
 * implementation.
 *
 */

import proxy                   from 'express-http-proxy';

import config                  from '../config';
import { resourceEndpoints }   from '../constants';
import sensorthings            from 'sensorthings'

let sensorthingsAPI;

if (config.get('sensorthings.server') !==
    config.default('sensorthings.server')) {
  /**
   * At the moment, we are using Sensorup as our remote implementation
   * of the Sensorthings API, but we should be able to proxy to any
   * other remote server.
   *
   * You will need to get an access token by creating an account at
   * https://pg.sensorup.com/playground.html
   *
   * Add the access token to your 'sensorthings.remote.credentials.token'
   * config file entry.
   */
  sensorthingsAPI = proxy(config.get('sensorthings.server'), {
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
      // Add auth header.
      const header = config.get('sensorthings.credentials.header');
      proxyReq.headers[header] = config.get('sensorthings.credentials.value');

      proxyReq.path = config.get('sensorthings.path') + proxyReq.path;

      return proxyReq;
    }
  });
} else {
  //Init DB
  sensorthingsAPI = sensorthings({
    db: config.get('db'),
    api_version: config.get('version')
  });
}

export default sensorthingsAPI
