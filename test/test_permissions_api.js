import should from 'should';
import supertest from 'supertest-as-promised';

import app from '../src/server';
import db from '../src/models/db';
import config from '../src/config';

import { loginAsAdmin } from './common';

const endpointPrefix = '/' + config.get('version');
const server = supertest(app);

describe('Permissions API', () => {
  let adminToken;
  before(function*() {
    adminToken = yield loginAsAdmin(server);
  });

  describe(`GET ${endpointPrefix}/permissions`, () => {
    it('should get list of default permissions', function*() {
      yield server.get(`${endpointPrefix}/permissions`)
                  .set('Authorization', `Bearer ${adminToken}`)
                  .expect('Content-Type', /json/)
                  .expect(200, { permissions: config.get('permissions')});
    });

    it('should get list of modified permissions', function*() {
      const permission = 'permissions';
      const permissions = config.get('permissions').concat(permission);
      const { Permissions } = yield db();
      yield Permissions.create({ name: permission });
      yield server.get(`${endpointPrefix}/permissions`)
                  .set('Authorization', `Bearer ${adminToken}`)
                  .expect('Content-Type', /json/)
                  .expect(200, { permissions });
    });
  });
});
