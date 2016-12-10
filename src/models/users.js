import btoa     from 'btoa';
import jwt      from 'jsonwebtoken';

import config   from '../config';
import {
  UNAUTHORIZED,
  UNSUPPORTED_AUTH_METHOD
} from '../errors';

// Supported authentication methods.
const authMethods = {
  BASIC: 'basic'
};

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('Users', {
    identifier: { type: DataTypes.STRING(256), primaryKey: true }
  });

  User.authenticate = (method, data) => {
    if (!authMethods[method]) {
      return Promise.reject(new Error(UNSUPPORTED_AUTH_METHOD));
    }

    // For now we only support admin authentication.
    if (btoa('admin:' + config.get('adminPass')) !== data) {
      return Promise.reject(new Error(UNAUTHORIZED));
    }

    return Promise.resolve(jwt.sign({
      id: 'admin',
      scope: 'admin'
    }, config.get('adminSessionSecret')));
  };

  Object.keys(authMethods).forEach(key => { User[key] = key; });

  return User;
};
