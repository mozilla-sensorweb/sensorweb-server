/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 // A client datastore backed by PostgreSQL.

import pg     from 'pg';
import config from '../config';

const DEBUG = false;

function debug(msg, writer = console.log) {
  DEBUG && writer(`[pgstore] ${msg}`);
}

function debug_log(msg) {
  debug(`LOG: ${msg}`, console.log);
}

function debug_error(msg) {
  debug(`ERROR: ${msg}`, console.error);
}

let pool;

// Creates the table.
function init() {
  // It currently connects to the default PostgreSQL instance.
  const db_config = {
    host: config.get('db.host'),
    port: config.get('db.port'),
    database: config.get('db.name'),
    user: config.get('db.user'),
    password: config.get('db.password'),
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
                              // before being closed
  };
  pool = new pg.Pool(db_config);

  // TODO: we can likely use varchar(XX) for at least the key and secret.
  pool.query('CREATE TABLE IF NOT EXISTS api_clients (name text PRIMARY KEY, key text, secret text)')
      .then(() => {
        return pool.query('CREATE INDEX IF NOT EXISTS api_client_key_idx ON api_clients (key)');
      })
      .catch(debug_error);
}

 // All the functions are returning promises.
 const store = {
   hasKey: key => {
     debug(`hasKey ${key}`);
     return pool.query('SELECT * FROM api_clients WHERE key = $1', [key])
       .then(res => {
         if (res.rowCount == 0) {
           return Promise.reject();
         }
         return Promise.resolve(res.rows[0]);
       });
   },

   hasName: name => {
     debug(`hasName ${name}`);
     return pool.query('SELECT * FROM api_clients WHERE name = $1', [name])
       .then(res => {
         if (res.rowCount == 0) {
           return Promise.reject();
         }
         return Promise.resolve(res.rows[0]);
       });
   },

   removeByKey: key => {
     debug(`removeByKey ${key}`);
     return pool.query('DELETE FROM api_clients WHERE key = $1', [key])
       .then(() => { return Promise.resolve(); });
   },

   add: client => {
     debug(`add ${JSON.stringify(client)}`);
     return pool.query('INSERT INTO api_clients (name, key, secret) VALUES ($1, $2, $3)',
                  [client.name, client.key, client.secret]).then(res => {
       debug(JSON.stringify(res));
       return Promise.resolve(client);
     });
   },

   getAll: () => {
     debug('getAll');
     return pool.query('SELECT * FROM api_clients').then(res => {
       debug_log(JSON.stringify(res));
       return Promise.resolve(res.rowCount == 0 ? [] : res.rows);
     });
   },

   clear: () => {
     debug('clear');
     return pool.query('DELETE FROM api_clients').then(() =>
      { return Promise.resolve(); });
   }
 }

init();

export default store;
