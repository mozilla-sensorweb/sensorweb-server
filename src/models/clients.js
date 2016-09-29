import { randomBytes } from 'crypto';

import { RECORD_ALREADY_EXISTS } from '../errors';

// XXX temporary store clients in memory.
let memStore = {};

exports.create = name => {
  return new Promise((resolve, reject) => {
    if (memStore[name]) {
      return reject(new Error(RECORD_ALREADY_EXISTS));
    }
    const key = randomBytes(8).toString('hex');
    const secret = randomBytes(64).toString('hex');
    memStore[name] = {
      name,
      key,
      secret
    };
    resolve(memStore[name]);
  });
}

exports.getAll = () => {
  const all = Object.keys(memStore).map(key => {
    // Do not expose secret.
    return Object.assign({}, memStore[key], { secret: undefined });
  });
  return Promise.resolve(all);
}

exports.get = (key, includeSecret = false) => {
  return new Promise((resolve, reject) => {
    if (includeSecret) {
      return resolve(memStore[key]);
    }

    resolve(Object.assign({}, memStore[key], { secret: undefined }));
  });
}

exports.remove = key => {
  if (memStore[key]) {
    delete memStore[key];
  }
  return Promise.resolve();
}

exports.clear = () => {
  if (process.env.NODE_ENV !== 'test') {
    return Promise.resolve();
  }
  memStore = {};
  return Promise.resolve();
}
