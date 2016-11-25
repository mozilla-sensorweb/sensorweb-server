import btoa       from 'btoa';
import should     from 'should';
import supertest  from 'supertest';

import app        from '../src/server';
import users      from '../src/models/users';
import config     from '../src/config';
import {
  errnos,
  ERRNO_UNAUTHORIZED,
  errors,
  UNAUTHORIZED
} from '../src/errors';

const endpointPrefix = '/' + config.get('version');
const server = supertest.agent(app);

describe('Users API', () => {
  describe('POST ' + endpointPrefix + '/users/auth', () => {
    it('should response 401 Unauthorized if there is no auth header', done => {
      server.post(endpointPrefix + '/users/auth')
            .expect(401)
            .end((err, res) => {
              res.status.should.be.equal(401);
              res.body.code.should.be.equal(401);
              res.body.errno.should.be.equal(errnos[ERRNO_UNAUTHORIZED]);
              res.body.error.should.be.equal(errors[UNAUTHORIZED]);
              done();
            });
    });
  });

  describe('POST ' + endpointPrefix + '/users/auth', () => {
    it('should response 401 Unauthorized if auth header is invalid', done => {
      server.post(endpointPrefix + '/users/auth')
            .set('Authorization', 'Invalid')
            .expect(401)
            .end((err, res) => {
              res.status.should.be.equal(401);
              res.body.code.should.be.equal(401);
              res.body.errno.should.be.equal(errnos[ERRNO_UNAUTHORIZED]);
              res.body.error.should.be.equal(errors[UNAUTHORIZED]);
              done();
            });
    });
  });

  describe('POST ' + endpointPrefix + '/users/auth', () => {
    it('should response 401 Unauthorized if admin pass is incorrect', done => {
      server.post(endpointPrefix + '/users/auth')
            .set('Authorization', 'Basic invalidpassword')
            .expect(401)
            .end((err, res) => {
              res.status.should.be.equal(401);
              res.body.code.should.be.equal(401);
              res.body.errno.should.be.equal(errnos[ERRNO_UNAUTHORIZED]);
              res.body.error.should.be.equal(errors[UNAUTHORIZED]);
              done();
            });
    });
  });

  describe('POST ' + endpointPrefix + '/users/auth', () => {
    it('should response 201 Created if admin pass is correct', done => {
      const pass = btoa('admin:' + config.get('adminPass'));
      server.post(endpointPrefix + '/users/auth')
            .set('Authorization', 'Basic ' + pass)
            .expect(201)
            .end((err, res) => {
              res.status.should.be.equal(201);
              should.exist(res.body.token);
              done();
            });
    });
  });
});
