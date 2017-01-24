import btoa       from 'btoa';
import jwt        from 'jsonwebtoken';
import nock       from 'nock';
import should     from 'should';
import supertest  from 'supertest-as-promised';
import url        from 'url';

import app        from '../src/server';
import db         from '../src/models/db';
import config     from '../src/config';
import {
  errnos,
  ERRNO_UNAUTHORIZED,
  errors,
  UNAUTHORIZED
} from '../src/errors';

import {
  createClient,
  loginAsAdmin,
  signClientRequest
} from './common';

const endpointPrefix = '/' + config.get('version');
const server = supertest(app);

describe('Authentication API', () => {
  // TODO Use Template Strings, promises and generators. (issue #59)
  describe('POST ' + endpointPrefix + '/auth/basic', () => {
    it('should respond 401 Unauthorized if there is no auth header', done => {
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

    it('should respond 401 Unauthorized if auth header is invalid', done => {
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

    it('should respond 401 Unauthorized if admin pass is incorrect', done => {
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

    it('should respond 201 Created if admin pass is correct', done => {
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

  describe(`GET ${endpointPrefix}/auth/facebook`, function() {
    const endpoint = `${endpointPrefix}/auth/facebook`;
    const redirectUrls = [
      'http://redirect.me/1',
      'http://redirect.me/2'
    ];
    const failureRedirectUrls = [
      'http://failure.redirect.me/1',
      'http://failure.redirect.me/2'
    ];

    beforeEach(function*() {
      const { Clients } = yield db();
      yield Clients.destroy({ where: {}});
    });

    it('should respond 401 unauthorized if there is no client token', function*() {
      yield server.get(endpoint)
                  .expect(401)
                  .expect({
                    code: 401,
                    errno: errnos[ERRNO_UNAUTHORIZED],
                    error: errors[UNAUTHORIZED]
                  });
    });

    it('should respond 401 unauthorized with a bad token', function*() {
      yield server.get(endpoint)
                  .query({ authToken: 'blablabla' })
                  .expect(401)
                  .expect({
                    code: 401,
                    errno: errnos[ERRNO_UNAUTHORIZED],
                    error: errors[UNAUTHORIZED]
                  });

    });

    it('should respond 400 if the client has no redirect url', function*() {
      const adminToken = yield loginAsAdmin(server);
      const client = yield createClient(server, adminToken, { name: 'test' });
      const authToken = yield signClientRequest(
        client, { redirectUrl: redirectUrls[0] }
      );

      yield server.get(endpoint)
                  .query({ authToken: authToken })
                  .expect(400);
    });

    it('should respond 400 if the redirect urls mismatch', function*() {
      const adminToken = yield loginAsAdmin(server);
      const client = yield createClient(
        server, adminToken,
        {
          name: 'test',
          authRedirectUrls: [ redirectUrls[0] ],
          authFailureRedirectUrls: [ failureRedirectUrls[0] ],
        }
      );

      let authToken = yield signClientRequest(
        client, { redirectUrl: redirectUrls[1] }
      );

      yield server.get(endpoint)
                  .query({ authToken: authToken })
                  .expect(400);

      authToken = yield signClientRequest(client, null);

      yield server.get(endpoint)
                  .query({ authToken: authToken })
                  .expect(400);

      authToken = yield signClientRequest(
        client, { redirectUrl: redirectUrls[0] }
      );

      yield server.get(endpoint)
                  .query({ authToken: authToken })
                  .expect(302);
    });

    it('callback should 403 Forbidden if there is no session', function*() {
      yield server.get(`${endpoint}/callback`)
                  .query({ code: 'some_code' })
                  .expect(403);
    });

    it('facebook login flow with a proper token', function*() {
      const adminToken = yield loginAsAdmin(server);
      const client = yield createClient(
        server, adminToken,
        {
          name: 'test',
          authRedirectUrls: redirectUrls,
          authFailureRedirectUrls: failureRedirectUrls,
        }
      );

      const authToken = yield signClientRequest(client, {
        redirectUrl: redirectUrls[1],
        failureUrl: failureRedirectUrls[1]
      });

      // Supertest's agent keeps the cookies
      const agent = supertest.agent(app);
      let res = yield agent.get(endpoint)
                           .query({ authToken: authToken })
                           .expect(302)
                           .expect('location', /facebook\.com/)
                           .expect('set-cookie', /^connect\.sid\.auth=/);

      // This is Facebook's anti-CSRF protection
      const state = url.parse(res.headers.location, true).query.state;

      // Let's mock the Facebook Graph server
      const facebook = nock('https://graph.facebook.com')
        .post('/oauth/access_token')
        .query(true)
        .reply(
          200, { access_token: 'access_token', refresh_token: 'refresh_token' }
        )

        .get('/v2.5/me')
        .query(true)
        .reply(200, { id: 'facebook_id' });

      const expectedId = {
        opaqueId: 'facebook_id',
        provider: 'facebook',
        clientKey: client.key,
      };

      res = yield agent.get(`${endpoint}/callback`)
                 .query({ code: 'facebook_return_code' })
                 .query({ state })
                 .expect(302)
                 .expect(
                   'location', new RegExp(`^${redirectUrls[1]}\\?token=`)
                 );
      const token = url.parse(res.headers.location, true).query.token;
      const decodedToken = jwt.verify(token, config.get('adminSessionSecret'));
      decodedToken.should.match({ id: expectedId, scope: 'user' });

      facebook.done();
      nock.cleanAll();
      nock.restore();

      const { Users } = yield db();
      const user = yield Users.findOne({ where: expectedId });
      should.exist(user);
    });
  });
});
