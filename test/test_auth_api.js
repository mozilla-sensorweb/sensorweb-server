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

describe('Authentication API', () => {
  describe('POST ' + endpointPrefix + '/auth/basic', () => {
    it('should response 401 Unauthorized if there is no auth header', done => {
      server.post(endpointPrefix + '/auth/basic')
            .expect(401)
            .end((err, res) => {
              res.status.should.be.equal(401);
              res.body.code.should.be.equal(401);
              res.body.errno.should.be.equal(errnos[ERRNO_UNAUTHORIZED]);
              res.body.error.should.be.equal(errors[UNAUTHORIZED]);
              done();
            });
    });

    it('should response 401 Unauthorized if auth header is invalid', done => {
      server.post(endpointPrefix + '/auth/basic')
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

    it('should response 401 Unauthorized if admin pass is incorrect', done => {
      server.post(endpointPrefix + '/auth/basic')
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

    it('should response 201 Created if admin pass is correct', done => {
      const pass = btoa('admin:' + config.get('adminPass'));
      server.post(endpointPrefix + '/auth/basic')
            .set('Authorization', 'Basic ' + pass)
            .expect(200)
            .end((err, res) => {
              res.status.should.be.equal(201);
              should.exist(res.body.token);
              done();
            });
    });
  });

  describe.only(`POST ${endpointPrefix}/auth/facebook`, function() {
    it('should redirect to the facebook endpoint', function*() {
      
    })
  });
});
