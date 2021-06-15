import { Router } from 'express';
import * as userCtrl from './user.ctrl';

const router = Router();

router.get('/:user_id', userCtrl.getUser);
router.get('/:user_id/feed', userCtrl.getUserFeed);

router.post('/:user_id/follow', userCtrl.followUser);
router.delete('/:user_id/follow', userCtrl.unfollowUser);

export default router;
