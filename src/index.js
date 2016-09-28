import bodyParser       from 'body-parser';
import cors             from 'cors';
import express          from 'express';
import expressValidator from 'express-validator';
import owasp            from 'owasp-password-strength-test';
import path             from 'path';

import clients          from './routes/clients';
import users            from './routes/users';

let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(bodyParser.json());

app.use(cors());

app.use('/api/clients', clients);
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
