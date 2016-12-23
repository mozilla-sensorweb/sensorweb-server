import express  from 'express';

import basic    from './auth/basic';
import facebook from './auth/facebook';

import config   from '../config';

const router = express.Router();

router.use('/basic', basic);

if (config.get('facebook.clientID')) {
  router.use('/facebook', facebook);
}

router.get('/', (req, res) => {
  res.type('html');
  res.send(`
    <!doctype html>
    <html>
      <head>
        <title>Login</title>
        <style>
          .facebook {
            color: white;
            background-color: #3b5998;
          }

          .twitter {
            color: black;
            background-color: #1da1f2;
          }
        </style>
      </head>
      <body>
        <div class='loggedin' hidden></div>
        <div class='providers' hidden>
        <button type='button' class='facebook' data-provider='facebook'>
          Login with Facebook
        </button>
        <!--
        <button type='button' class='twitter' data-provider='twitter'>
          Login with Twitter
        </button>
        -->
        </div>
        <script>
          function checkTokenExists() {
            const providers = document.querySelector('.providers');
            const loggedin = document.querySelector('.loggedin');

            if (localStorage.token) {
              providers.hidden = true;
              loggedin.hidden = false;
              loggedin.textContent =
                "logged in with token " + localStorage.token;
              const clearButton = document.createElement('button');
              clearButton.type = 'button';
              clearButton.textContent = 'clear';
              loggedin.appendChild(clearButton)
            } else {
              providers.hidden = false;
              loggedin.hidden = true;
            }
          }

          document.querySelector('.providers').addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
              window.open('${req.baseUrl}/' + e.target.dataset.provider);
            }
          });
          document.querySelector('.loggedin').addEventListener('click', e => {
              if (e.target.tagName === 'BUTTON') {
                localStorage.removeItem('token');
                checkTokenExists();
              }
          });

          checkTokenExists();
          window.addEventListener('storage', checkTokenExists);
        </script>
      </body>
    </html>
  `);
});

export default router;
