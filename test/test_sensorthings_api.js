import should     from 'should';
import supertest  from 'supertest';

import app            from '../src/server';
import config         from '../src/config';
import { resourceEndpoints } from '../src/constants';

const endpointPrefix = '/' + config.get('version');
const server = supertest.agent(app);

describe('Sensorthings API', () => {
  resourceEndpoints.forEach(endpoint => {
    describe('GET ' + endpointPrefix + '/' + endpoint, () => {
      it('should response 200 OK with count 0', done => {
        server.get(endpointPrefix + '/' + endpoint)
              .expect(200)
              .end((err, res) => {
          res.body['@iot.count'].should.be.equal(0);
          res.body.value.should.be.instanceof(Array).and.have.lengthOf(0);
          done();
        });
      });
    });
  });
});
