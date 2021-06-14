import { Router } from 'express';
import auth from './auth';
import users from './users';
import tweets from './tweets';

const router = Router();

router.use('/auth', auth);
router.use('/users', users);
router.use('/tweets', tweets);

export default router;
