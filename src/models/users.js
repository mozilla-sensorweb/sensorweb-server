import config   from '../config';
import {
  UNAUTHORIZED,
  UNSUPPORTED_AUTH_METHOD
} from '../errors';

// Supported authentication methods.
const authMethods = {
  BASIC: ({ username, password }) => {
    // For now we only support admin authentication.
    if (username !== 'admin' || password !== config.get('adminPass')) {
      return Promise.reject(new Error(UNAUTHORIZED));
    }

    // Currently Basic authentication is for admins only so let's hardcode this.
    return Promise.resolve({
      id: 'admin',
      scope: 'admin'
    });
  },

  AUTH_PROVIDER: (data) => {
    // We use this authentication method only for users.
    return Promise.resolve({
      id: data,
      scope: 'user'
    });
  },
};

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('Users', {
    opaqueId: { type: DataTypes.STRING(256) },
    provider: { type: DataTypes.STRING(32) },
  }, {
    indexes: [{
      unique: true,
      fields: ['opaqueId', 'provider', 'clientKey']
      // note: clientKey is a foreign key created at the association steps below
    }]
  });

  User.authenticate = (method, data) => {
    if (!authMethods[method]) {
      return Promise.reject(new Error(UNSUPPORTED_AUTH_METHOD));
    }

    return authMethods[method](data)
      .then(userData => {
        if (userData.scope !== 'user') {
          return userData;
        }

        return User.findOrCreate({
          attributes: [],
          where: userData.id, // this contains all user attributes
        }).then(() => userData);
      });
  };

  User.associate = (db) => {
    db.Users.belongsTo(
      db.Clients,
      {
        foreignKey: { name: 'clientKey', allowNull: false },
        onDelete: 'CASCADE',
      }
    );
    db.Clients.hasMany(db.Users, { foreignKey: 'clientKey' });
  };

  Object.keys(authMethods).forEach(key => { User[key] = key; });

  return User;
};
