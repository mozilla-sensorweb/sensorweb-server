import jwt      from 'jsonwebtoken';
import url      from 'url';

import config   from '../../config';

export default function finalizeAuth(req, res) {
  const userData = {
    id: req[req.authScope],
    scope: req.authScope,
  };

  const token = jwt.sign(userData, config.get('adminSessionSecret'));

  if (req.session && req.session.redirectUrl) {
    const redirectUrl = url.parse(req.session.redirectUrl, true);
    redirectUrl.query.token = token;
    req.session.destroy();
    res.redirect(url.format(redirectUrl));
    return;
  }

  res.status(201).json({ token });
}
