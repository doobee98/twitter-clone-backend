import { Router } from 'express';
import * as userCtrl from './user.ctrl';

const router = Router();

router.get('/:user_id', userCtrl.getUser);

export default router;
