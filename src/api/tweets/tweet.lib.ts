import { tweetDatabase, tweetLikeDatabase } from '../../api/firebase';
import { Tweet, TweetModel } from 'models/Tweet';

export const getTweetLikeId = (userId: string, tweetId: string) => {
  return `${userId}-${tweetId}`;
};

interface getTweetFromModelParams {
  currentUserId?: string;
}

export const getTweetFromModel = async (
  tweetModel: TweetModel,
  params: getTweetFromModelParams,
): Promise<Tweet> => {
  const { currentUserId } = params;

  let replyCount = 0;
  if (tweetModel.reply_id) {
    const replyTweetIdList = await tweetDatabase.queryAllId((collection) =>
      collection.where('reply_id', '==', tweetModel.reply_id),
    );
    replyCount = replyTweetIdList.length;
  }

  // TODO
  const retweetCount = 0;

  const likeUserIdList = await tweetLikeDatabase.queryAllId((collection) =>
    collection.where('tweet_id', '==', tweetModel.tweet_id),
  );
  const likeCount = likeUserIdList.length;

  let likeFlag = false;
  if (currentUserId) {
    const tweetLikeId = getTweetLikeId(currentUserId, tweetModel.tweet_id);
    likeFlag = await tweetLikeDatabase.has(tweetLikeId);
  }

  const tweet: Tweet = {
    ...tweetModel,
    reply_count: replyCount,
    retweet_count: retweetCount,
    like_count: likeCount,
    like_flag: likeFlag,
  };

  return tweet;
};
