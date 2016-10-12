/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import db  from '../src/pg_store';
import should from 'should';

describe('db for api clients', () => {
  it('1. should succeed to clear db', done => {
    db.clear().then(done);
  });

  it('2. should be an empty db', done => {
    db.getAll().then(
      (res) => {
        res.length.should.be.equal(0);
        done();
      },
      () => {
        should.ok(false);
      }
    );
  });

  it('3. should not have the `test` name', done => {
    db.hasName('test')
      .then(
        () => { should.ok(false); },
        () => { done(); }
      );
  });

  it('4. should add a test client', done => {
    const client = { name: 'test', key: 'key1', secret: 'secret1' };
    db.add(client).then(
      (res) => {
        res.name.should.be.equal('test');
        res.key.should.be.equal('key1');
        res.secret.should.be.equal('secret1');
        done();
      },
      () => { should.ok(false); }
    );
  });

  it('5. should have the `test` name', done => {
    db.hasName('test')
      .then(
        (res) => {
          res.name.should.be.equal('test');
          res.key.should.be.equal('key1');
          res.secret.should.be.equal('secret1');
          done();
        },
        () => { should.ok(false); }
      );
  });

  it('6. should have have one client registered', done => {
    db.getAll()
      .then(
        (res) => {
          res.length.should.be.equal(1);
          res[0].name.should.be.equal('test');
          res[0].key.should.be.equal('key1');
          res[0].secret.should.be.equal('secret1');
          done();
        },
        () => { should.ok(false); }
      );
  });

  it('7. should add a second client', done => {
    const client = { name: 'test2', key: 'key2', secret: 'secret2' };
    db.add(client).then(
      (res) => {
        res.name.should.be.equal('test2');
        res.key.should.be.equal('key2');
        res.secret.should.be.equal('secret2');
        done();
      },
      () => { should.ok(false); }
    );
  });

  it('8. should have have two client registered', done => {
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
        () => { should.ok(false); }
      );
  });

  it('9. should fail to add a client with the same name', done => {
    const client = { name: 'test2', key: 'key2', secret: 'secret2' };
    db.add(client).then(
      (res) => {
        should.ok(false);
      },
      () => { done(); }
    );
  });

  it('10. should remove a client by key', done => {
    db.removeByKey('key1').then(
      done,
      () => { should.ok(false); }
    );
  });

  it('11. should have have one client registered', done => {
    db.getAll()
      .then(
        (res) => {
          res.length.should.be.equal(1);
          res[0].name.should.be.equal('test2');
          res[0].key.should.be.equal('key2');
          res[0].secret.should.be.equal('secret2');
          done();
        },
        () => { should.ok(false); }
      );
  });

  it('12. should succeed to cleanup db', done => {
    db.clear().then(done);
  });

  it('13. should be an empty db', done => {
    db.getAll().then(
      (res) => {
        res.length.should.be.equal(0);
        done();
      },
      () => {
        should.ok(false);
      }
    );
  });
});
