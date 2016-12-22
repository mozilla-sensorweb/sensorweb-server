import express  from 'express';

import basic    from './auth/basic';
import facebook from './auth/facebook';

import config   from '../config';

const router = express.Router();

console.log('basic');
router.use('/basic', basic);

if (config.get('facebook.clientID')) {
  console.log('facebook');
  router.use('/facebook', facebook);
}

export default router;
