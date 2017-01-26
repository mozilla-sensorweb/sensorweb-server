import btoa       from 'btoa';
import should     from 'should';
import supertest  from 'supertest';

import app        from '../src/server';
import db         from '../src/models/db';
import config     from '../src/config';
import {
  BAD_REQUEST,
  errnos,
  ERRNO_FORBIDDEN,
  ERRNO_INVALID_API_CLIENT_NAME,
  ERRNO_INVALID_API_CLIENT_PERMISSION,
  ERRNO_INVALID_API_CLIENT_REDIRECT_URL,
  ERRNO_UNAUTHORIZED,
  errors,
  FORBIDDEN,
  UNAUTHORIZED
} from '../src/errors';

const endpointPrefix = '/' + config.get('version');
const server = supertest.agent(app);
let token;

describe('Clients API', () => {
  before((done) => {
    // XXX use common's loginAsAdmin function (issue #60)
    const pass = btoa('admin:' + config.get('adminPass'));
    server.post(endpointPrefix + '/auth/basic')
          .set('Authorization', 'Basic ' + pass)
          .end((err, res) => {
            should.exist(res.body.token);
            token = res.body.token;
            done();
          });
  });

  beforeEach(function*() {
    const { Clients } = yield db();
    yield Clients.destroy({ where: {} });
  });

  describe('POST ' + endpointPrefix + '/clients', () => {
    const postAndCheckSuccess = (done, body) => {
      server.post(endpointPrefix + '/clients')
            .set('Authorization', 'Bearer ' + token)
            .send(body)
            .expect('Content-type', /json/)
            .end((err, res) => {
              should.not.exist(err);
              res.status.should.be.equal(201);
              res.body.key.should.be.instanceof(String)
                 .and.have.lengthOf(16);
              res.body.secret.should.be.instanceof(String)
                 .and.have.lengthOf(128);
              done();
            });
    };

    const postAndCheckError = (done, body, auth, error) => {
      server.post(endpointPrefix + '/clients')
            .set('Authorization', auth ? 'Bearer ' + token : '')
            .send(body)
            .expect('Content-type', /json/)
            .expect(error.code)
            .end((err, res) => {
              res.status.should.be.equal(error.code);
              res.body.code.should.be.equal(error.code);
              res.body.errno.should.be.equal(
                errnos[error.errno]);
              res.body.error.should.be.equal(errors[error.error]);
              done();
            });
    };

    it('should respond 401 Unauthorized if there is no auth header', done => {
      server.post(endpointPrefix + '/clients')
            .expect('Content-type', /json/)
            .expect(401)
            .end((err, res) => {
              res.status.should.be.equal(401);
              res.body.code.should.be.equal(401);
              res.body.errno.should.be.equal(errnos[ERRNO_UNAUTHORIZED]);
              res.body.error.should.be.equal(errors[UNAUTHORIZED]);
              done();
            });
    });

    [{
      reason: 'there is no auth header',
      auth: false,
      code: 401,
      error: UNAUTHORIZED,
      errno: ERRNO_UNAUTHORIZED
    }, {
      reason: 'name param is missing',
      body: {},
      auth: true,
      code: 400,
      error: BAD_REQUEST,
      errno: ERRNO_INVALID_API_CLIENT_NAME
    }, {
      reason: 'name param is empty',
      body: { name: '' },
      auth: true,
      code: 400,
      error: BAD_REQUEST,
      errno: ERRNO_INVALID_API_CLIENT_NAME
    }, {
      reason: 'authRedirectUrls param is not an array of URLs',
      body: { name: 'clientName', authRedirectUrls: 'notAnArrayOfUrls' },
      auth: true,
      code: 400,
      error: BAD_REQUEST,
      errno: ERRNO_INVALID_API_CLIENT_REDIRECT_URL
    }, {
      reason: 'authRedirectUrls param is not an array of URLs',
      body: { name: 'clientName',
              authRedirectUrls: ['http://something.com'],
              authFailureRedirectUrls: 'notAnArrayOfUrls' },
      auth: true,
      code: 400,
      error: BAD_REQUEST,
      errno: ERRNO_INVALID_API_CLIENT_REDIRECT_URL
    }, {
      reason: 'authFailureRedirectUrls is present but authRedirectUrls is not',
      body: { name: 'clientName',
              authFailureRedirectUrls: ['http://something.com'] },
      auth: true,
      code: 400,
      error: BAD_REQUEST,
      errno: ERRNO_INVALID_API_CLIENT_REDIRECT_URL
    }, {
      reason: 'permissions list has unknown permission',
      body: { name: 'clientName',
              permissions: ['banana'] },
      auth: true,
      code: 400,
      error: BAD_REQUEST,
      errno: ERRNO_INVALID_API_CLIENT_PERMISSION
    }].forEach(test => {
      it(`should respond ${test.code} if ${test.reason}`, done => {
        postAndCheckError(done, test.body, test.auth, {
          code: test.code,
          error: test.error,
          errno: test.errno
        });
      });
    });

    [{
      reason: 'should respond 201 Created if request contains empty ' +
              'redirect URLs',
      body: {
        name: 'name',
        authRedirectUrls: [],
        authFailureRedirectUrls: []
      }
    }, {
      reason: 'should respond 201 Created if request has valid name ' +
              'and redirect URLs',
      body: {
        name: 'name',
        authRedirectUrls: ['http://something.com'],
        authFailureRedirectUrls: ['http://something.com']
      }
    }, {
      reason: 'should respond 201 Created if request has valid name and ' +
              'valid permissions array',
      body: {
        name: 'name',
        permissions: config.get('permissions')
      }
    }, {
      reason: 'should respond 201 Created if request has valid name and ' +
              'valid permission string',
      body: {
        name: 'name',
        permissions: config.get('permissions')[0]
      }
    }].forEach(test => {
      it(test.reason, done => {
        postAndCheckSuccess(done, test.body);
      });
    });

    it('should respond 403 Forbidden if API client is already registered',
       done => {
      const name = 'clientName';
      postAndCheckSuccess(() => {
        postAndCheckError(done, { name }, true /* auth */, {
          code: 403,
          error: FORBIDDEN,
          errno: ERRNO_FORBIDDEN
        });
      }, { name });
    });
  });

  describe('GET ' + endpointPrefix + '/clients', () => {
    beforeEach(() => {
      return db().then(models => {
        models.Clients.destroy({ where: {} });
      });
    });

    it('should respond 401 Unauthorized if there is no auth header', done => {
      server.get(endpointPrefix + '/clients')
            .expect('Content-type', /json/)
            .expect(401)
            .end((err, res) => {
              res.status.should.be.equal(401);
              res.body.code.should.be.equal(401);
              res.body.errno.should.be.equal(errnos[ERRNO_UNAUTHORIZED]);
              res.body.error.should.be.equal(errors[UNAUTHORIZED]);
              done();
            });
    });

    it('should respond 200 OK with an empty array', done => {
      server.get(endpointPrefix + '/clients')
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-type', /json/)
            .expect(200)
            .end((err, res) => {
              res.status.should.be.equal(200);
              res.body.should.be.instanceof(Array).and.have.lengthOf(0);
              done();
            });
    });

    it('should respond 200 OK with an array containing the registered client',
       done => {
      const url = 'http://domain.org';
      new Promise(resolve => {
        server.post(endpointPrefix + '/clients')
              .set('Authorization', 'Bearer ' + token)
              .send({ name: 'clientName',
                      authRedirectUrls: [url],
                      authFailureRedirectUrls: [url],
                      permissions: config.get('permissions') })
              .expect('Content-type', /json/)
              .expect(201)
              .end(resolve);
      }).then(() => {
        server.get(endpointPrefix + '/clients')
              .set('Authorization', 'Bearer ' + token)
              .expect('Content-type', /json/)
              .expect(200)
              .end((err, res) => {
                res.status.should.be.equal(200);
                res.body.should.be.instanceof(Array).and.have.lengthOf(1);
                res.body.forEach(client => {
                  client.should.have.properties('name');
                  client.should.have.properties('key');
                  client['authRedirectUrls'].should.be.deepEqual([url]);
                  client['authFailureRedirectUrls'].should.be.deepEqual([url]);
                  client['permissions'].should.be.deepEqual(
                    config.get('permissions')
                  );

                });
                done();
              });
      });
    });
  });

  describe('DELETE ' + endpointPrefix + '/clients/:key', () => {
    it('should respond 401 Unauthorized if there is no auth header', done => {
      server.delete(endpointPrefix + '/clients/whatever')
            .expect('Content-type', /json/)
            .expect(401)
            .end((err, res) => {
              res.status.should.be.equal(401);
              res.body.code.should.be.equal(401);
              res.body.errno.should.be.equal(errnos[ERRNO_UNAUTHORIZED]);
              res.body.error.should.be.equal(errors[UNAUTHORIZED]);
              done();
            });
    });

    it('should respond 204 NoResponse if request is to remove existing client',
       done => {
      db().then(models => {
        models.Clients.create({
          name: 'test'
        }).then(client => {
          server.delete(endpointPrefix + '/clients/' + client.key)
                .set('Authorization', 'Bearer ' + token)
                .expect('Content-type', /json/)
                .expect(204)
                .end((err, res) => {
                  res.status.should.be.equal(204);
                  models.Clients.findAll({
                    where: {
                      key: client.key
                    }
                  }).then(result => {
                    result.should.be.instanceof(Array).and.have.lengthOf(0);
                    done();
                  });
                });
        });
      });
    });

    it('should respond 204 NoResponse if request is to remove non existing ' +
       'client',
       done => {
      server.delete(endpointPrefix + '/clients/whatever')
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-type', /json/)
            .expect(204)
            .end((err, res) => {
              res.status.should.be.equal(204);
              done();
            });
    });
  });
});
