/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 // A client datastore backed by PostgreSQL.

import pg  from 'pg';
import config from './config';

const DEBUG = false;

function debug(msg, writer = console.log) {
  DEBUG && writer(`[cratestore] ${msg}`);
}

function debug_log(msg) {
  debug(`LOG: ${msg}`, console.log);
}

function debug_error(msg) {
  debug(`ERROR: ${msg}`, console.error);
}

var pool;

// Creates the table.
function init() {
  // TODO: get host:port, and user/passwd from the config.
  // It currently connects to the default PostgreSQL instance.
  const db_config = {
    database: 'sensorweb', //env var: PGDATABASE
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  };
  pool = new pg.Pool(db_config);

  // TODO: we can likely use varchar(XX) for at least the key and secret.
  // TODO: add an index on `key`.
  pool.query('CREATE TABLE IF NOT EXISTS api_clients (name text PRIMARY KEY, key text, secret text)')
  .then(debug_log, debug_error);
}

 // All the functions are returning promises.
 const store = {
   hasKey: (key) => {
     debug(`hasKey ${key}`);
     return new Promise((resolve, reject) => {
       pool.query('select * from api_clients where key = $1', [key])
       .then(
         (res) => {
           if (res.rowCount == 0) {
             reject();
             return;
           }
           resolve(res.rows[0]);
         },
         reject);
     });
   },

   hasName: (name) => {
     debug(`hasName ${name}`);
     return new Promise((resolve, reject) => {
       pool.query('select * from api_clients where name = $1', [name])
        .then(
          (res) => {
            if (res.rowCount == 0) {
              reject();
              return;
            }
            resolve(res.rows[0]);
          },
          reject);
     });
   },

   removeByKey: (key) => {
     debug(`removeByKey ${key}`);
     return new Promise((resolve, reject) => {
       pool.query('delete from api_clients where key = $1', [key])
       .then(
         () => { resolve(); },
         reject);
     });
   },

   add: (client) => {
     debug(`add ${JSON.stringify(client)}`);
     return new Promise((resolve, reject) => {
       pool.query('insert into api_clients (name, key, secret) values ($1, $2, $3)',
                  [client.name, client.key, client.secret])
        .then(
          (res) => {
            debug(JSON.stringify(res));
            resolve(client);
          },
          reject);
     });
   },

   getAll: () => {
     debug('getAll');
     return new Promise((resolve, reject) => {
       pool.query('select * from api_clients')
        .then(
          (res) => {
            if (res.rowCount == 0) {
              resolve([]);
              return;
            }
            debug_log(JSON.stringify(res));
            resolve(res.rows);
          },
          reject);
     });
   },

   clear: () => {
     debug('clear');
     return new Promise((resolve, reject) => {
       pool.query('delete from api_clients')
        .then(() => resolve(), reject);
     });
   }
 }

init();

export default store;
