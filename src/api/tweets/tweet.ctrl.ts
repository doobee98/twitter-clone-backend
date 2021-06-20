import { RequestHandler } from 'express';
import { RetweetModel, Tweet, TweetModel } from 'models/Tweet';
import {
  retweetDatabase,
  tweetDatabase,
  tweetLikeDatabase,
  userDatabase,
  userFollowDatabase,
} from '../firebase';
import { arrayEquals, getCurrentDate } from '../../utils';
import * as TweetLib from './tweet.lib';
import { TweetLikeModel } from 'models/TweetLike';

/**
 * 새로운 트윗 작성
 * @route POST /api/tweets
 * @group tweets - 트윗 관련
 * @param {tweetCreateEntry.model} tweetCreateEntry.body - 새로운 트윗 입력
 * @returns {Tweet.model} 201 - 생성된 트윗 정보
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10508 - 400 내용이 없는 트윗입니다.
 */
export const createNewTweet: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id: writer_id } = res.locals.user;
    const { content, image_src_list, reply_permission } = req.body;

    const writer = await userDatabase.get(writer_id);
    if (!writer) {
      // TODO: 여기에서 ERROR를 내보내는게 좀 이상하다.
      throw new Error('USERS_INVALID_USER_ID');
    }

    if (!content) {
      throw new Error('TWEETS_NO_CONTENT');
    }

    const tweet_id = await tweetDatabase.generateAutoId();

    const newTweetModel: TweetModel = {
      type: 'tweet',
      tweet_id,
      tweeted_at: getCurrentDate(),
      writer_id,
      content,
      image_src_list,
      reply_permission,
    };
    await tweetDatabase.add(tweet_id, newTweetModel);

    const newTweet: Tweet = {
      ...newTweetModel,
      writer_name: writer.username,
      writer_profile_img_src: writer.profile_img_src,
      reply_count: 0,
      retweet_count: 0,
      like_count: 0,
      like_flag: false,
      retweet_flag: false,
    };

    res.status(201).send(newTweet);
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 트윗 가져오기
 * @route GET /api/tweets/{tweet_id}
 * @group tweets - 트윗 관련
 * @returns {Tweet.model} 200 - 해당 트윗 정보
 * @returns {Error} 10501 - 404 존재하지 않는 트윗입니다.
 */
export const getTweet: RequestHandler = async (req, res, next) => {
  try {
    const currentUserId = res.locals.user?.user_id;
    const { tweet_id } = req.params;
    const tweetModel = await tweetDatabase.get(tweet_id);

    if (!tweetModel) {
      throw new Error('TWEETS_NOT_EXIST');
    }

    const tweet = await TweetLib.getTweetFromTweetModel(tweetModel, {
      currentUserId,
    });

    res.status(200).send(tweet);
  } catch (error) {
    next(error);
  }
};

/**
 * 작성한 특정 트윗 수정
 * @route PUT /api/tweets/{tweet_id}
 * @group tweets - 트윗 관련
 * @param {tweetEditEntry.model} tweetEditEntry.body - 변경할 트윗 정보 입력
 * @returns {Tweet.model} 201 - 변경된 트윗 정보
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10501 - 404 존재하지 않는 트윗입니다.
 * @returns {Error} 10502 - 401 해당 트윗 수정 권한이 없습니다.
 * @returns {Error} 10508 - 400 내용이 없는 트윗입니다.
 * @returns {Error} 10503 - 400 변경 사항이 없습니다.
 */
export const editTweet: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const currentUserId = res.locals.user?.user_id;
    const { user_id: writer_id } = res.locals.user;
    const { content, image_src_list, reply_permission } = req.body;
    const { tweet_id } = req.params;
    const tweetModel = await tweetDatabase.get(tweet_id);

    if (!tweetModel) {
      throw new Error('TWEETS_NOT_EXIST');
    }

    if (tweetModel.writer_id !== writer_id) {
      throw new Error('TWEETS_NO_EDIT_PERMISSION');
    }

    if (!content) {
      throw new Error('TWEETS_NO_CONTENT');
    }

    if (
      content === tweetModel.content &&
      arrayEquals(image_src_list, tweetModel.image_src_list ?? [])
    ) {
      throw new Error('TWEETS_NO_EDIT_CONTENT');
    }

    await tweetDatabase.update(tweet_id, { content, image_src_list });

    const tweet = TweetLib.getTweetFromTweetModel(tweetModel, {
      currentUserId,
    });

    res.status(201).send(tweet);
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 트윗 삭제
 * @route DELETE /api/tweets/{tweet_id}
 * @group tweets - 트윗 관련
 * @returns {object} 204 - No Content
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10501 - 404 존재하지 않는 트윗입니다.
 * @returns {Error} 10502 - 401 해당 트윗 수정 권한이 없습니다.
 */
export const deleteTweet: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id: writer_id } = res.locals.user;
    const { tweet_id } = req.params;
    const tweet = await tweetDatabase.get(tweet_id);

    if (!tweet) {
      throw new Error('TWEETS_NOT_EXIST');
    }

    if (tweet.writer_id !== writer_id) {
      throw new Error('TWEETS_NO_EDIT_PERMISSION');
    }

    await tweetDatabase.remove(tweet_id);

    // Retweet Database에서도 관련 내용 삭제
    const retweetIds = await retweetDatabase.queryAllId((collection) =>
      collection.where('retweet_tweet_id', '==', tweet_id),
    );

    Promise.all(retweetIds.map((id) => retweetDatabase.remove(id)));

    // TweetLike Database에서도 관련 내용 삭제
    const tweetLikeIds = await tweetLikeDatabase.queryAllId((collection) =>
      collection.where('tweet_id', '==', tweet_id),
    );

    Promise.all(tweetLikeIds.map((id) => tweetLikeDatabase.remove(id)));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 트윗 리트윗하기
 * @route POST /api/tweets/{tweet_id}/retweet
 * @group tweets - 트윗 관련
 * @returns {Tweet.model} 200 - 생성된 트윗 정보
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10506 - 400 이미 리트윗한 트윗입니다.
 */
export const createRetweet: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id: currentUserId } = res.locals.user;
    const { tweet_id } = req.params;
    const tweet = await tweetDatabase.get(tweet_id);

    if (!tweet) {
      throw new Error('TWEETS_NOT_EXIST');
    }

    const newRetweetId = TweetLib.getRetweetId(currentUserId, tweet_id);
    const hasRetweet = await retweetDatabase.has(newRetweetId);

    if (hasRetweet) {
      throw new Error('TWEETS_RETWEET_ALREADY_EXIST');
    }

    const newRetweetModel: RetweetModel = {
      retweet_user_id: currentUserId,
      retweet_tweet_id: tweet_id,
      retweeted_at: getCurrentDate(),
    };

    await retweetDatabase.add(newRetweetId, newRetweetModel);
    res.status(201).send();
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 트윗 리트윗 취소
 * @route DELETE /api/tweets/{tweet_id}/retweet
 * @group tweets - 트윗 관련
 * @returns {Tweet.model} 200 - 생성된 트윗 정보
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10507 - 400 리트윗 취소를 할 수 없습니다.
 */
export const cancelRetweet: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id: currentUserId } = res.locals.user;
    const { tweet_id } = req.params;
    const tweet = await tweetDatabase.get(tweet_id);

    if (!tweet) {
      throw new Error('TWEETS_NOT_EXIST');
    }

    const retweetId = TweetLib.getRetweetId(currentUserId, tweet_id);
    const hasRetweet = await retweetDatabase.has(retweetId);

    if (!hasRetweet) {
      throw new Error('TWEETS_RETWEET_NO_EXIST');
    }

    await retweetDatabase.remove(retweetId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 트윗 댓글로 새로운 트윗 작성
 * @route POST /api/tweets/{tweet_id}/reply
 * @group tweets - 트윗 관련
 * @param {tweetCreateEntry.model} tweetCreateEntry.body - 새로운 트윗 입력
 * @returns {Tweet.model} 201 - 생성된 트윗 정보
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10508 - 400 내용이 없는 트윗입니다.
 * @returns {Error} 10501 - 404 존재하지 않는 트윗입니다.
 */
export const createReply: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const currentUserId = res.locals.user?.user_id;
    const { tweet_id: reply_id } = req.params;
    const { content, image_src_list } = req.body;

    if (!content) {
      throw new Error('TWEETS_NO_CONTENT');
    }

    const hasTweet = await tweetDatabase.has(reply_id);

    if (!hasTweet) {
      throw new Error('TWEETS_NOT_EXIST');
    }

    const replyId = await tweetDatabase.generateAutoId();

    const replyTweetModel: TweetModel = {
      type: 'reply',
      tweet_id: replyId,
      tweeted_at: getCurrentDate(),
      writer_id: currentUserId,
      content,
      image_src_list,
      reply_id,
    };
    await tweetDatabase.add(replyId, replyTweetModel);

    const replyTweet: Tweet = await TweetLib.getTweetFromTweetModel(
      replyTweetModel,
      {
        currentUserId,
      },
    );

    res.status(201).send(replyTweet);
  } catch (error) {
    next(error);
  }
};

/**
 * 트윗 좋아요
 * @route POST /api/tweets/{tweet_id}/like
 * @group tweets - 트윗 관련
 * @returns {object} 201 - No Content
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10501 - 404 존재하지 않는 트윗입니다.
 * @returns {Error} 10504 - 400 이미 좋아요를 누른 트윗입니다.
 */
export const likeTweet: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id } = res.locals.user;
    const { tweet_id } = req.params;
    const tweet = await tweetDatabase.get(tweet_id);

    if (!tweet) {
      throw new Error('TWEETS_NOT_EXIST');
    }

    const newTweetLikeId = TweetLib.getTweetLikeId(user_id, tweet_id);
    const hasTweetLike = await tweetLikeDatabase.has(newTweetLikeId);

    if (hasTweetLike) {
      throw new Error('TWEETS_LIKE_ALREADY_EXIST');
    }

    const newTweetLikeModel: TweetLikeModel = {
      user_id,
      tweet_id,
      like_at: getCurrentDate(),
    };

    await tweetLikeDatabase.add(newTweetLikeId, newTweetLikeModel);
    res.status(201).send();
  } catch (error) {
    next(error);
  }
};

/**
 * 트윗 좋아요 취소
 * @route DELETE /api/tweets/{tweet_id}/like
 * @group tweets - 트윗 관련
 * @returns {object} 204 - No Content
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10501 - 404 존재하지 않는 트윗입니다.
 * @returns {Error} 10505 - 400 좋아요 취소를 할 수 없는 트윗입니다.
 */
export const dislikeTweet: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id } = res.locals.user;
    const { tweet_id } = req.params;
    const tweet = await tweetDatabase.get(tweet_id);

    if (!tweet) {
      throw new Error('TWEETS_NOT_EXIST');
    }

    const tweetLikeId = TweetLib.getTweetLikeId(user_id, tweet_id);
    const hasTweetLike = await tweetLikeDatabase.has(tweetLikeId);

    if (!hasTweetLike) {
      throw new Error('TWEETS_LIKE_NO_EXIST');
    }

    await tweetLikeDatabase.remove(tweetLikeId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * 트윗 피드 가져오기 - 페이지네이션 (자기 자신 트윗 + 팔로잉한 유저 트윗/리트윗)
 * @route POST /api/tweets/feed
 * @group tweets - 트윗 관련
 * @param {tweetFeedEntry.model} tweetFeedEntry.body - 트윗 피드 리스트 조건
 * @returns {Array.<Tweet>} 200 - 트윗 리스트
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 */
export const getTweetsFeed: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id: currentUserId } = res.locals.user;
    const { offset, count } = req.body;

    const userFollowList = await userFollowDatabase.queryAll((collection) =>
      collection.where('following_user_id', '==', currentUserId),
    );

    const followingUserIdList = userFollowList.map(
      (userFollow) => userFollow.followed_user_id,
    );

    const tweetModelList = await tweetDatabase.queryAll(
      (collection) =>
        collection
          .where('writer_id', 'in', [currentUserId, ...followingUserIdList])
          .orderBy('tweeted_at', 'desc')
          .limit(offset - 1 + count), // TODO: need to limit 'from'
    );

    const retweetModelList =
      !followingUserIdList || followingUserIdList.length === 0
        ? []
        : await retweetDatabase.queryAll(
            (collection) =>
              collection
                .where('retweet_user_id', 'in', followingUserIdList)
                .orderBy('retweeted_at', 'desc')
                .limit(offset - 1 + count), // TODO: need to limit 'from'
          );

    const tweetGetter = (tweetModel: TweetModel) =>
      TweetLib.getTweetFromTweetModel(tweetModel, { currentUserId });

    const retweetGetter = (retweetModel: RetweetModel) =>
      TweetLib.getTweetFromRetweetModel(retweetModel, { currentUserId });

    const getterList: { at: string; getter: () => Promise<Tweet> }[] = [
      ...tweetModelList.map((tweetModel) => ({
        at: tweetModel.tweeted_at,
        getter: () => tweetGetter(tweetModel),
      })),
      ...retweetModelList.map((retweetModel) => ({
        at: retweetModel.retweeted_at,
        getter: () => retweetGetter(retweetModel),
      })),
    ];

    const feed = await Promise.all(
      getterList
        .sort((item1, item2) => {
          if (Date.parse(item1.at) >= Date.parse(item2.at)) {
            return -1;
          }
          if (Date.parse(item1.at) === Date.parse(item2.at)) {
            return 0;
          }
          return 1;
        })
        .slice(offset - 1, offset - 1 + count)
        .map((item) => item.getter()),
    );

    res.status(200).send(feed);
  } catch (error) {
    next(error);
  }
};
