import { Router } from 'express';
import * as tweetCtrl from './tweet.ctrl';

const router = Router();

router.post('/', tweetCtrl.createNewTweet);
router.post('/feed', tweetCtrl.getTweetsFeed);
router.get('/:tweet_id', tweetCtrl.getTweet);
router.put('/:tweet_id', tweetCtrl.editTweet);
router.delete('/:tweet_id', tweetCtrl.deleteTweet);

router.post('/:tweet_id/reply', tweetCtrl.createReply);

router.post('/:tweet_id/like', tweetCtrl.likeTweet);
router.delete('/:tweet_id/like', tweetCtrl.dislikeTweet);

export default router;
