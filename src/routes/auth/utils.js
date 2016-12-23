import jwt      from 'jsonwebtoken';

import config   from '../../config';

export function finalizeAuth(req, res) {
  const token = jwt.sign(req.user, config.get('adminSessionSecret'));
  res.format({
    json: () => res.status(201).json({ token }),
    html: () => {
      res.send(`
        <script>
          localStorage["token"] = "${token}";
          window.close();
        </script>
      `);
    }
  });
}
