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

  describe('POST ' + endpointPrefix + '/clients', () => {
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

    it('should respond 400 BadRequest if name param is missing', done => {
      server.post(endpointPrefix + '/clients')
            .set('Authorization', 'Bearer ' + token)
            .expect('Content-type', /json/)
            .expect(400)
            .end((err, res) => {
              res.status.should.be.equal(400);
              res.body.code.should.be.equal(400);
              res.body.errno.should.be.equal(errnos[ERRNO_INVALID_API_CLIENT_NAME]);
              res.body.error.should.be.equal(errors[BAD_REQUEST]);
              done();
            });
    });

    it('should respond 400 BadRequest if name param is empty', done => {
      server.post(endpointPrefix + '/clients')
            .set('Authorization', 'Bearer ' + token)
            .send({ name: '' })
            .expect('Content-type', /json/)
            .expect(400)
            .end((err, res) => {
              res.status.should.be.equal(400);
              res.body.code.should.be.equal(400);
              res.body.errno.should.be.equal(errnos[ERRNO_INVALID_API_CLIENT_NAME]);
              res.body.error.should.be.equal(errors[BAD_REQUEST]);
              done();
            });
    });

    [{
      reason: 'authRedirectUrls param is not an array of URLs',
      body: { name: 'clientName', authRedirectUrls: 'notAnArrayOfUrls' }
    }, {
      reason: 'authRedirectUrls param is not an array of URLs',
      body: { name: 'clientName',
              authRedirectUrls: ['http://something.com'],
              authFailureRedirectUrls: 'notAnArrayOfUrls' }
    }, {
      reason: 'authFailureRedirectUrls is present but authRedirectUrls is not',
      body: { name: 'clientName',
              authFailureRedirectUrls: ['http://something.com'] }
    }].forEach(test => {
      it('should respond 400 BadRequest if ' + test.reason, done => {
        server.post(endpointPrefix + '/clients')
              .set('Authorization', 'Bearer ' + token)
              .send(test.body)
              .expect('Content-type', /json/)
              .expect(400)
              .end((err, res) => {
                res.status.should.be.equal(400);
                res.body.code.should.be.equal(400);
                res.body.errno.should.be.equal(
                  errnos[ERRNO_INVALID_API_CLIENT_REDIRECT_URL]);
                res.body.error.should.be.equal(errors[BAD_REQUEST]);
                done();
              });
      });
    });

    [{
      reason: 'should respond 201 Created if request contains empty ' +
              'redirect URLs',
      clientName: 'clientName',
      body: {
        authRedirectUrls: [],
        authFailureRedirectUrls: []
      }
    }, {
      reason: 'should respond 201 Created if request has valid name ' +
              'and redirect URLs',
      clientName: 'anotherClientName',
      body: {
        authRedirectUrls: ['http://something.com'],
        authFailureRedirectUrls: ['http://something.com']
      }
    }].forEach(test => {
      it(test.reason, done => {
        test.body.name = test.clientName;
        server.post(endpointPrefix + '/clients')
              .set('Authorization', 'Bearer ' + token)
              .send(test.body)
              .expect('Content-type', /json/)
              .expect(201)
              .end((err, res) => {
                res.status.should.be.equal(201);
                res.body.name.should.be.equal(test.clientName);
                res.body.key.should.be.instanceof(String)
                   .and.have.lengthOf(16);
                res.body.secret.should.be.instanceof(String)
                   .and.have.lengthOf(128);
                done();
              });
      });
    });

    it('should respond 403 Forbidden if API client is already registered',
       done => {
      const name = 'clientName';
      server.post(endpointPrefix + '/clients')
            .set('Authorization', 'Bearer ' + token)
            .send({ name: 'clientName' })
            .expect('Content-type', /json/)
            .expect(403)
            .end((err, res) => {
              res.status.should.be.equal(403);
              res.body.code.should.be.equal(403);
              res.body.errno.should.be.equal(errnos[ERRNO_FORBIDDEN]);
              res.body.error.should.be.equal(errors[FORBIDDEN]);
              done();
            });
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
      new Promise(resolve => {
        server.post(endpointPrefix + '/clients')
              .set('Authorization', 'Bearer ' + token)
              .send({ name: 'clientName',
                      authRedirectUrls: ['http://something.com'],
                      authFailureRedirectUrls: ['http://something.com'] })
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
                  client['authRedirectUrls'].should.be.instanceof(Array)
                        .and.have.lengthOf(1);
                  client['authFailureRedirectUrls'].should.be.instanceof(Array)
                        .and.have.lengthOf(1);
                  client.should.not.have.properties('secret');
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
