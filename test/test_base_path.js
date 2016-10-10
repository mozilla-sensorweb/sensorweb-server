import should     from 'should';
import supertest  from 'supertest';

import app            from '../src/server';
import base           from '../src/routes/base';
import config         from '../src/config';
import { resources }  from '../src/routes/base';

const endpointPrefix = '/api/v' + config.get('version');
const server = supertest.agent(app);

describe('Base path', () => {
  it('should response 200 OK with an array of the available resource endpoints',
     done => {
    server.get(endpointPrefix + '/')
          .expect(200)
          .end((err, res) => {
      should.exist(res.body.value);
      let value = res.body.value;
      const prepath = 'http://127.0.0.1' + endpointPrefix + '/';
      Object.keys(resources).forEach(resource => {
        value.should.containDeep([{
          name: resources[resource],
          url: prepath + resources[resource]
        }]);
      });
      done();
    });
  });
});
