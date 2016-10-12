import { randomBytes } from 'crypto';

import config                    from '../config';
import { RECORD_ALREADY_EXISTS } from '../errors';

import store  from '../pg_store';

const DEBUG = false;

function debug(msg) {
  DEBUG && console.log(`[client.js] ${msg}`);
}

exports.create = name => {
  debug(`create ${name}`);
  return store.hasName(name).then(
    () => {
      debug('This name already exists');
      return Promise.reject(new Error(RECORD_ALREADY_EXISTS));
    },
    () => {
      const key = randomBytes(8).toString('hex');
      const secret = randomBytes(64).toString('hex');
      let client = {
        name,
        key,
        secret
      };
      debug(`adding ${JSON.stringify(client)}`);
      return store.add(client);
    });
}

exports.getAll = () => {
  debug(`getAll`);
  return store.getAll().then(
    (clients) => {
      return Promise.resolve(Object.keys(clients).map(key => {
        // Do not expose secret.
        return Object.assign({}, clients[key], { secret: undefined });
      }));
    });
}

exports.get = (key, includeSecret = false) => {
  debug(`get ${key} ${includeSecret}`);
  return store.hasKey(key).then(
    (client) => {
      if (includeSecret) {
        return Promise.resolve(client);
      }

      return Promise.resolve(
        Object.assign({}, client, { secret: undefined })
      );
    },
    () => {
      return Promise.resolve(null);
    });
}

exports.remove = key => {
  debug(`remove ${key}`);
  return store.removeByKey(key);
}

exports.clear = () => {
  debug(`clear`);
  if (config.get('env') !== 'test') {
    return Promise.resolve();
  }
  return store.clear();
}
