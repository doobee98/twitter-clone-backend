import { Router } from 'express';
import * as tweetCtrl from './tweet.ctrl';

const router = Router();

router.post('/', tweetCtrl.createNewTweet);
router.post('/feed', tweetCtrl.getTweetsFeed);
router.get('/:tweet_id', tweetCtrl.getTweet);
router.put('/:tweet_id', tweetCtrl.editTweet);
router.delete('/:tweet_id', tweetCtrl.deleteTweet);

export default router;
