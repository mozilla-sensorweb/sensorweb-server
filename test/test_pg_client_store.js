/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import db  from '../src/models/pg_store';
import should from 'should';

function fail(done) {
  should.ok(false);
  done();
}

describe('db for api clients', () => {
  before(done => {
    db.clear().then(done);
  });

  it('should be an empty db', done => {
    db.getAll().then(
      (res) => {
        res.length.should.be.equal(0);
        done();
      },
      () => { fail(done); }
    );
  });

  it('should not have the `test` name', done => {
    db.hasName('test')
      .then(
        () => { fail(done); },
        () => { done(); }
      );
  });

  it('should not have the `key1` key', done => {
    db.hasKey('key1')
      .then(
        () => { fail(done); },
        () => { done(); }
      );
  });

  it('should add a test client', done => {
    const client = { name: 'test', key: 'key1', secret: 'secret1' };
    db.add(client).then(
      (res) => {
        res.name.should.be.equal(client.name);
        res.key.should.be.equal(client.key);
        res.secret.should.be.equal(client.secret);
        done();
      },
      () => { fail(done); }
    );
  });

  it('should have the `test` name', done => {
    db.hasName('test')
      .then(
        (res) => {
          res.name.should.be.equal('test');
          res.key.should.be.equal('key1');
          res.secret.should.be.equal('secret1');
          done();
        },
        () => { fail(done); }
      );
  });

  it('should have the `key1` key', done => {
    db.hasKey('key1')
      .then(
        () => { done() },
        () => { fail(done); }
      );
  });

  it('should have one client registered', done => {
    db.getAll()
      .then(
        (res) => {
          res.length.should.be.equal(1);
          res[0].name.should.be.equal('test');
          res[0].key.should.be.equal('key1');
          res[0].secret.should.be.equal('secret1');
          done();
        },
        () => { fail(done); }
      );
  });

  it('should add a second client', done => {
    const client = { name: 'test2', key: 'key2', secret: 'secret2' };
    db.add(client).then(
      (res) => {
        res.name.should.be.equal(client.name);
        res.key.should.be.equal(client.key);
        res.secret.should.be.equal(client.secret);
        done();
      },
      () => { fail(done); }
    );
  });

  it('should have have two client registered', done => {
    db.getAll()
      .then(
        (res) => {
          res.length.should.be.equal(2);
          res[0].name.should.be.equal('test');
          res[0].key.should.be.equal('key1');
          res[0].secret.should.be.equal('secret1');
          res[1].name.should.be.equal('test2');
          res[1].key.should.be.equal('key2');
          res[1].secret.should.be.equal('secret2');
          done();
        },
        () => { fail(done); }
      );
  });

  it('should fail to add a client with the same name', done => {
    const client = { name: 'test2', key: 'key2', secret: 'secret2' };
    db.add(client).then(
      (res) => { fail(done); },
      () => { done(); }
    );
  });

  it('should remove a client by key', done => {
    db.removeByKey('key1').then(
      done,
      () => { fail(done); }
    );
  });

  it('should have have one client registered', done => {
    db.getAll()
      .then(
        (res) => {
          res.length.should.be.equal(1);
          res[0].name.should.be.equal('test2');
          res[0].key.should.be.equal('key2');
          res[0].secret.should.be.equal('secret2');
          done();
        },
        () => { fail(done); }
      );
  });

  after(done => {
    db.clear().then(done);
  });
});
