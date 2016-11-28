import should    from 'should';
import supertest from 'supertest';

import app    from '../src/server';
import config from '../src/config';

const server = supertest.agent(app);

describe('Health checks', () => {
  ['/',
   '/__heartbeat__',
   '/__lbheartbeat__'].forEach(endpoint => {
    it('should response 200 OK to GET ' + endpoint + ' request', done => {
      server.get(endpoint)
      .expect(200)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(200);
        done();
      });
    });
  });

  it('should response 200 with JSON file to GET /__version__ request',
     done => {
    server.get('/__version__')
    .expect(200)
    .expect('Content-type', /json/)
    .end((err, res) => {
      should.not.exist(err);
      res.status.should.be.equal(200);
      should.exist(res.body.source);
      should.exist(res.body.version);
      should.exist(res.body.commit);
      done();
    });
  });
});
