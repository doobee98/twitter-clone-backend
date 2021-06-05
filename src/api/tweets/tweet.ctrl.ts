import { RequestHandler } from 'express';
import Tweet from 'models/Tweet';
import { tweetDatabase } from '../firebase';
import { arrayEquals } from '../../utils';

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

    const newTweet: Tweet = {
      type: 'tweet',
      tweet_id,
      tweeted_at: Date(),
      writer_id,
      content,
      image_src_list,
      reply_count: 0,
      retweet_count: 0,
      like_count: 0,
    };
    await tweetDatabase.add(tweet_id, newTweet);

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
    const { tweet_id } = req.params;
    const tweet = await tweetDatabase.get(tweet_id);

    if (!tweet) {
      throw new Error('TWEETS_NOT_EXIST');
    }

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

    const { user_id: writer_id } = res.locals.user;
    const { content, image_src_list } = req.body;
    const { tweet_id } = req.params;
    const tweet = await tweetDatabase.get(tweet_id);

    if (!tweet) {
      throw new Error('TWEETS_NOT_EXIST');
    }

    if (tweet.writer_id !== writer_id) {
      throw new Error('TWEETS_NO_EDIT_PERMISSION');
    }

    if (!content && !image_src_list) {
      throw new Error('TWEETS_NO_EDIT_CONTENT');
    }

    if (
      content === tweet.content ||
      arrayEquals(image_src_list, tweet.image_src_list ?? [])
    ) {
      throw new Error('TWEETS_NO_EDIT_CONTENT');
    }

    await tweetDatabase.update(tweet_id, { content, image_src_list });
    const newTweet = await tweetDatabase.get(tweet_id);

    res.status(201).send(newTweet);
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
 * (TODO) 특정 트윗 댓글로 새로운 트윗 작성
 * @route POST /api/tweets/{tweet_id}/reply
 * @group tweets - 트윗 관련
 * @param {tweetCreateEntry.model} tweetCreateEntry.body - 새로운 트윗 입력
 * @returns {Tweet.model} 201 - 생성된 트윗 정보
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10501 - 404 존재하지 않는 트윗입니다.
 * @returns {Error} 10502 - 401 해당 트윗 수정 권한이 없습니다.
 */
export const createReply: RequestHandler = async (req, res, next) => {
  try {
    // TODO
  } catch (error) {
    next(error);
  }
};

/**
 * (TODO) 트윗 좋아요
 * @route POST /api/tweets/{tweet_id}/like
 * @group tweets - 트윗 관련
 * @returns {object} 204 - No Content
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10501 - 404 존재하지 않는 트윗입니다.
 * @returns {Error} 10502 - 401 해당 트윗 수정 권한이 없습니다.
 */
export const likeTweet: RequestHandler = async (req, res, next) => {
  try {
    // TODO
  } catch (error) {
    next(error);
  }
};

/**
 * (TODO) 트윗 좋아요 취소
 * @route DELETE /api/tweets/{tweet_id}/like
 * @group tweets - 트윗 관련
 * @returns {object} 204 - No Content
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10501 - 404 존재하지 않는 트윗입니다.
 * @returns {Error} 10502 - 401 해당 트윗 수정 권한이 없습니다.
 */
export const dislikeTweet: RequestHandler = async (req, res, next) => {
  try {
    // TODO
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
    const { offset, count } = req.body;

    // TODO: 개선필요: 정확하게 count만큼만 가져오는 방법?
    const tweets = await tweetDatabase.queryAll((collection) =>
      collection.orderBy('tweeted_at', 'desc').limit(offset - 1 + count),
    );

    res.status(200).send(tweets.slice(offset - 1));
  } catch (error) {
    next(error);
  }
};
