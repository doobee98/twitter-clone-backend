import { Router } from 'express';
import auth from './auth';
import tweets from './tweets';

const router = Router();

router.use('/auth', auth);
router.use('/tweets', tweets);

export default router;
