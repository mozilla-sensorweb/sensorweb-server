/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import config from '../config';
import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import sequelizeFixtures from 'sequelize-fixtures';

const IDLE           = 0
const INITIALIZING   = 1;
const READY          = 2;

function Deferred() {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });

  return this;
};

let deferreds = [];

let state = IDLE;
let db    = null;

const { name, user, password, host, port } = config.get('db');

const sequelize = new Sequelize(name, user, password, {
  host,
  port,
  dialect: 'postgres',
  logging: false
});

export default function() {
  if (state === READY) {
    return Promise.resolve(db);
  }

  let deferred = new Deferred();
  deferreds.push(deferred);

  if (state == INITIALIZING) {
    return deferred.promise;
  }

  state = INITIALIZING;

  db = {};

  fs.readdirSync(__dirname)
    .filter(file => {
      return ((file.indexOf('.js') !== 0) &&
              !file.startsWith('.') &&
              (file !== 'db.js'));
    })
    .forEach(file => {
      const model = sequelize.import(path.join(__dirname, file));
      db[model.name] = model;
    });

  Object.keys(db).forEach(modelName => {
    if ('associate' in db[modelName]) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return sequelize.sync().then(() => {
    while (deferreds.length) {
      deferreds.pop().resolve(db);
    }
    state = READY;

    // Load default permissions.
    const permissions = config.get('permissions').map(permission => {
      return { model: 'Permissions', data: { name: permission }};
    });
    return sequelizeFixtures.loadFixtures(permissions, db);
  }).then(() => {
    return db;
  }).catch(e => {
    console.error(e);
    while (deferreds.length) {
      deferreds.pop().reject(e);
    }
  });
}

export { sequelize, Sequelize };
