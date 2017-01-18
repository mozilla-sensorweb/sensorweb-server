import co from 'co';
import jwt        from 'jsonwebtoken';

import config from '../src/config';

const endpointPrefix = `/${config.get('version')}`;

export function loginAsAdmin(server) {
  return co(function*() {
    const res = yield server.post(`${endpointPrefix}/auth/basic`)
                            .auth('admin', config.get('adminPass'))
                            .expect(201)
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

export function loginAsClient(server, client) {
  // TODO we should login as the client instead of generating a JWT here
  return Promise.resolve(jwt.sign({
    id: client.key,
    scope: 'client'
  }, client.secret));
}
