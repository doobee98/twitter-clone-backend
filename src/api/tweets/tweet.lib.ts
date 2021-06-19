import {
  retweetDatabase,
  tweetDatabase,
  tweetLikeDatabase,
  userDatabase,
} from '../../api/firebase';
import { RetweetModel, Tweet, TweetModel } from 'models/Tweet';

export const getTweetLikeId = (userId: string, tweetId: string) => {
  return `${userId}-${tweetId}`;
};

export const getRetweetId = (userId: string, tweetId: string) => {
  return `${userId}-${tweetId}`;
};

interface getTweetFromTweetModelParams {
  currentUserId?: string;
}

export const getTweetFromTweetModel = async (
  tweetModel: TweetModel,
  params: getTweetFromTweetModelParams,
): Promise<Tweet> => {
  const { currentUserId } = params;

  const writer = await userDatabase.get(tweetModel.writer_id);
  if (!writer) {
    // TODO: 여기에서 ERROR를 내보내는게 좀 이상하다.
    throw new Error('USERS_INVALID_USER_ID');
  }

  const replyTweetIdList = await tweetDatabase.queryAllId((collection) =>
    collection.where('reply_id', '==', tweetModel.tweet_id),
  );
  const replyCount = replyTweetIdList.length;

  const retweetIdList = await retweetDatabase.queryAllId((collection) =>
    collection.where('retweet_tweet_id', '==', tweetModel.tweet_id),
  );
  const retweetCount = retweetIdList.length;

  const likeIdList = await tweetLikeDatabase.queryAllId((collection) =>
    collection.where('tweet_id', '==', tweetModel.tweet_id),
  );
  const likeCount = likeIdList.length;

  let retweetFlag = false;
  let likeFlag = false;

  if (currentUserId) {
    const retweetId = getRetweetId(currentUserId, tweetModel.tweet_id);
    retweetFlag = await retweetDatabase.has(retweetId);

    const tweetLikeId = getTweetLikeId(currentUserId, tweetModel.tweet_id);
    likeFlag = await tweetLikeDatabase.has(tweetLikeId);
  }

  const tweet: Tweet = {
    ...tweetModel,
    writer_name: writer.username,
    writer_profile_img_src: writer.profile_img_src,
    reply_count: replyCount,
    retweet_count: retweetCount,
    like_count: likeCount,
    retweet_flag: retweetFlag,
    like_flag: likeFlag,
  };

  return tweet;
};

interface getTweetFromRetweetModelParams {
  currentUserId?: string;
}

export const getTweetFromRetweetModel = async (
  retweetModel: RetweetModel,
  params: getTweetFromRetweetModelParams,
): Promise<Tweet> => {
  const { currentUserId } = params;

  const originalTweetModel = await tweetDatabase.get(
    retweetModel.retweet_tweet_id,
  );
  if (!originalTweetModel) {
    // TODO: 여기에서 ERROR를 내보내는게 좀 이상하다.
    throw new Error('TWEETS_NOT_EXIST');
  }

  const originalTweet = await getTweetFromTweetModel(originalTweetModel, {
    currentUserId,
  });

  const retweet: Tweet = {
    ...originalTweet,
    type: 'retweet',
    retweet_writer_id: retweetModel.retweet_user_id,
    retweeted_at: retweetModel.retweeted_at,
  };

  return retweet;
};
