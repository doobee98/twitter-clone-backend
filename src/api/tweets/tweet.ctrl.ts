import { RequestHandler } from 'express';
import { Tweet, TweetModel } from 'models/Tweet';
import { tweetDatabase, tweetLikeDatabase } from '../firebase';
import { arrayEquals } from '../../utils';
import * as TweetLib from './tweet.lib';
import { TweetLikeModel } from 'models/TweetLike';

/**
 * 새로운 트윗 작성
 * @route POST /api/tweets
 * @group tweets - 트윗 관련
 * @param {tweetCreateEntry.model} tweetCreateEntry.body - 새로운 트윗 입력
 * @returns {Tweet.model} 201 - 생성된 트윗 정보
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 */
export const createNewTweet: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id: writer_id } = res.locals.user;
    const { content, image_src_list } = req.body;
    const tweet_id = await tweetDatabase.generateAutoId();

    const newTweetModel: TweetModel = {
      type: 'tweet',
      tweet_id,
      tweeted_at: Date(),
      writer_id,
      content,
      image_src_list,
    };
    await tweetDatabase.add(tweet_id, newTweetModel);

    const newTweet: Tweet = {
      ...newTweetModel,
      reply_count: 0,
      retweet_count: 0,
      like_count: 0,
      like_flag: false,
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

    const tweet = await TweetLib.getTweetFromModel(tweetModel, {
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
 * @returns {Error} 10503 - 400 변경 사항이 없습니다.
 */
export const editTweet: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const currentUserId = res.locals.user?.user_id;
    const { user_id: writer_id } = res.locals.user;
    const { content, image_src_list } = req.body;
    const { tweet_id } = req.params;
    const tweetModel = await tweetDatabase.get(tweet_id);

    if (!tweetModel) {
      throw new Error('TWEETS_NOT_EXIST');
    }

    if (tweetModel.writer_id !== writer_id) {
      throw new Error('TWEETS_NO_EDIT_PERMISSION');
    }

    if (!content && !image_src_list) {
      throw new Error('TWEETS_NO_EDIT_CONTENT');
    }

    if (
      content === tweetModel.content ||
      arrayEquals(image_src_list, tweetModel.image_src_list ?? [])
    ) {
      throw new Error('TWEETS_NO_EDIT_CONTENT');
    }

    await tweetDatabase.update(tweet_id, { content, image_src_list });

    const tweet = TweetLib.getTweetFromModel(tweetModel, { currentUserId });

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
 * (TODO) 특정 트윗 리트윗하기
 * @route POST /api/tweets/{tweet_id}/retweet
 * @group tweets - 트윗 관련
 * @returns {Tweet.model} 200 - 생성된 트윗 정보
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10402 - 400 존재하지 않는 아이디이거나 비밀번호가 잘못 입력되었습니다.
 */
export const createRetweet: RequestHandler = async (req, res, next) => {
  try {
    // TODO
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

    const hasTweet = await tweetDatabase.has(reply_id);

    if (!hasTweet) {
      throw new Error('TWEETS_NOT_EXIST');
    }

    const replyId = await tweetDatabase.generateAutoId();

    const replyTweetModel: TweetModel = {
      type: 'reply',
      tweet_id: replyId,
      tweeted_at: Date(),
      writer_id: currentUserId,
      content,
      image_src_list,
      reply_id,
    };
    await tweetDatabase.add(replyId, replyTweetModel);

    const replyTweet: Tweet = await TweetLib.getTweetFromModel(
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
      like_at: Date(),
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
 * (PROGRESS) 트윗 피드 가져오기 - 페이지네이션 (팔로잉된 유저만? 전부?)
 * @route POST /api/tweets/feed
 * @group tweets - 트윗 관련
 * @param {tweetFeedEntry.model} tweetFeedEntry.body - 트윗 피드 리스트 조건
 * @returns {Array.<Tweet>} 200 - 트윗 리스트
 */
export const getTweetsFeed: RequestHandler = async (req, res, next) => {
  try {
    /*
      TODO
      1. 로그인 된 상태라면 팔로잉 유저 것만 가져오기. 지금은 모든 tweet에서 가져옴
      2. 리얼타임을 어떻게 더 잘 대응할 수 있을까?
      3. 쿼리 제대로된 정의 필요. 지금은 쿼리 따로 없음
      4. 정렬도 시간 역순으로 하는게 맞는지 고민해보기
    */
    const currentUserId = res.locals.user?.user_id;
    const { offset, count } = req.body;

    // TODO: 개선필요: 정확하게 count만큼만 가져오는 방법?
    let tweetModels = await tweetDatabase.queryAll((collection) =>
      collection.orderBy('tweeted_at', 'desc').limit(offset - 1 + count),
    );
    tweetModels = tweetModels.slice(offset - 1);

    const tweets: Tweet[] = await Promise.all(
      tweetModels.map(async (tweetModel) => {
        return await TweetLib.getTweetFromModel(tweetModel, { currentUserId });
      }),
    );

    res.status(200).send(tweets);
  } catch (error) {
    next(error);
  }
};
