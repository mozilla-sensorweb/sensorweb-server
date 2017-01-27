import co  from 'co';
import jwt from 'jsonwebtoken';

import config from '../src/config';

const endpointPrefix = `/${config.get('version')}`;

export function loginAsAdmin(server) {
  return co(function*() {
    const key = config.get('adminClientKey');
    const secret = config.get('adminClientSecret');
    const authToken = yield signClientRequest({ key, secret }, {
      scopes: ['admin'],
      username: 'admin',
      password: config.get('adminPass')
    });
    const res = yield server.get(`${endpointPrefix}/auth/basic`)
                            .query({ authToken })
                            .expect(200)
                            .expect(res => res.body.token);

    return res.body.token;
  });
}

export function createClient(server, adminToken, client) {
  return co(function*() {
    const res = yield server.post(`${endpointPrefix}/clients`)
                            .set('Authorization', `Bearer ${adminToken}`)
                            .send(client)
                            .expect(201);

    return res.body;
  });
}

export function signClientRequest(client, payload) {
  const request = Object.assign({ clientKey: client.key }, payload);
  return Promise.resolve(jwt.sign(request, client.secret));
}
