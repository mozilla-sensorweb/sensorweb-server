/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import { randomBytes } from 'crypto';

module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Clients', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    key: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      defaultValue: () => {
        return randomBytes(8).toString('hex');
      },
    },
    secret: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: () => {
        return randomBytes(64).toString('hex');
      }
    }
  });
  return Client;
}
