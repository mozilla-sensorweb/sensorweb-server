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
    const pass = btoa('admin:' + config.get('adminPass'));
    server.post(endpointPrefix + '/users/auth')
          .set('Authorization', 'Basic ' + pass)
          .end((err, res) => {
            should.exist(res.body.token);
            token = res.body.token;
            done();
          });
  });

  describe('POST ' + endpointPrefix + '/clients', () => {
    it('should response 401 Unauthorized if there is no auth header', done => {
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

    it('should response 400 BadRequest if name param is missing', done => {
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

    it('should response 400 BadRequest if name param is empty', done => {
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

    it('should response 201 Created if request is valid', done => {
      const name = 'clientName';
      server.post(endpointPrefix + '/clients')
            .set('Authorization', 'Bearer ' + token)
            .send({ name: 'clientName' })
            .expect('Content-type', /json/)
            .expect(201)
            .end((err, res) => {
              res.status.should.be.equal(201);
              res.body.name.should.be.equal(name);
              res.body.key.should.be.instanceof(String).and.have.lengthOf(16);
              res.body.secret.should.be.instanceof(String).and.have.lengthOf(128);
              done();
            });
    });

    it('should response 403 Forbidden if API client is already registered',
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
    it('should response 401 Unauthorized if there is no auth header', done => {
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

    it('should response 200 OK with an array containing the registered client',
       done => {
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
                client.should.not.have.properties('secret');
              });
              done();
            });
    });

    it('should response 200 OK with an empty array',
       done => {
      db().then(models => {
        models.Clients.destroy({
          where: {}
        }).then(() => {
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
      });
    });
  });

  describe('DELETE ' + endpointPrefix + '/clients/:key', () => {
    it('should response 401 Unauthorized if there is no auth header', done => {
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

    it('should response 204 NoResponse if request is to remove existing client',
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

    it('should response 204 NoResponse if request is to remove non existing client',
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
