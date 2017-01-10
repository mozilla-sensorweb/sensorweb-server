import jwt      from 'jsonwebtoken';

import config   from '../../config';
import db       from '../../models/db';

export function finalizeAuth(req, res) {
  const token = jwt.sign(req.user, config.get('adminSessionSecret'));

  db().then(models => {
    const Clients = models.Clients;

    res.redirect(`${Clients.authCallbackUrl[0]}?token=${token}`);

    if (req.session) {
      req.session.destroy();
    }
  });
}
