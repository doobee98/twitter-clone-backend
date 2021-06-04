import { Router } from 'express';
import * as authCtrl from './auth.ctrl';

const router = Router();

router.get('/', authCtrl.currentUser);

router.post('/login', authCtrl.login);
router.get('/logout', authCtrl.logout);
router.get('/info', authCtrl.info);

router.post('/signup', authCtrl.signup);

export default router;
