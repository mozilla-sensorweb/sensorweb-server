import { randomBytes } from 'crypto';

// XXX temporary store clients in memory.
let memStore = {};

exports.create = name => {
  return new Promise((resolve, reject) => {
    if (memStore[name]) {
      // XXX error code.
      return reject(new Error());
    }
    const key = randomBytes(16).toString('hex');
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
    if (!memStore[key]) {
      // XXX error code.
      return reject(new Error());
    }

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
