import express from 'express';
import path from 'path';
import owasp from 'owasp-password-strength-test';

import users from './routes/users';

let app = express();

app.use('/api/users', users);

if (!process.env.ADMIN_PASS) {
  throw('You need to provide an admin pass setting the ADMIN_PASS env var.');
}

const adminPass = owasp.test(process.env.ADMIN_PASS);
if (!adminPass.strong) {
  adminPass.errors.forEach(error => console.error(error));
  throw('Admin pass is not strong enough.');
}

if (!process.env.JWT_SECRET) {
  throw('You need to provide a JWT secret setting the JWT_SECRET env var.');
}

app.listen(8080, () => console.log('Running on localhost:8080'));
