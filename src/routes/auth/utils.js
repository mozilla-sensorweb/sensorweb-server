import jwt      from 'jsonwebtoken';
import url      from 'url';

import config   from '../../config';

export function finalizeAuth(req, res) {
  const token = jwt.sign(req.user, config.get('adminSessionSecret'));

  if (req.session && req.session.redirectUrl) {
    const redirectUrl = url.parse(req.session.redirectUrl, true);
    redirectUrl.query.token = token;
    req.session.destroy();
    res.redirect(url.format(redirectUrl));
    return;
  }

  res.status(201).json({ token });
}
