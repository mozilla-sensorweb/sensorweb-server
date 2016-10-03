import should     from 'should';
import supertest  from 'supertest';

import app        from '../src/server';
import clients    from '../src/models/clients';
import config     from '../src/config';
import {
  BAD_REQUEST,
  errnos,
  ERRNO_INVALID_API_CLIENT_NAME,
  ERRNO_FORBIDDEN,
  errors,
  FORBIDDEN
} from '../src/errors';

const endpointPrefix = '/api/v' + config.get('version');
const server = supertest.agent(app);

describe('POST ' + endpointPrefix + '/clients', () => {
  it('should response 400 BadRequest if name param is missing', done => {
    server.post(endpointPrefix + '/clients')
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
  it('should response 200 OK with an array containing the registered client',
     done => {
    server.get(endpointPrefix + '/clients')
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
    clients.clear().then(() => {
      server.get(endpointPrefix + '/clients')
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

describe('DELETE ' + endpointPrefix + 'clients/:key', () => {
  it('should response 204 NoResponse if request is to remove existing client',
     done => {
    clients.create('test').then(client => {
      server.delete(endpointPrefix + '/clients/' + client.key)
            .expect('Content-type', /json/)
            .expect(204)
            .end((err, res) => {
              res.status.should.be.equal(204);
              clients.get(client.key).then(result => {
                should.not.exist(result);
                done();
              });
            });
    });
  });

  it('should response 204 NoResponse if request is to remove non existing client',
     done => {
    server.delete(endpointPrefix + '/clients/whatever')
          .expect('Content-type', /json/)
          .expect(204)
          .end((err, res) => {
            res.status.should.be.equal(204);
            done();
          });
  });

});
