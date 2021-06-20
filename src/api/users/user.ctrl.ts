import { RequestHandler } from 'express';
import { User, UserModel } from 'models/User';
import * as UserLib from './user.lib';
import * as TweetLib from '../tweets/tweet.lib';
import {
  retweetDatabase,
  tweetDatabase,
  tweetLikeDatabase,
  userDatabase,
  userFollowDatabase,
} from '../firebase';
import { UserFollowModel } from 'models/UserFollow';
import { RetweetModel, Tweet, TweetList, TweetModel } from 'models/Tweet';
import { getCurrentDate } from '../../utils';

/**
 * 유저 정보 가져오기
 * @route GET /api/users/{user_id}
 * @group users - 유저 관련
 * @returns {User.model} 200 - 해당 트윗 정보
 * @returns {Error} 10601 - 404 존재하지 않는 아이디입니다.
 */
export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const currentUserId = res.locals.user?.user_id;
    const { user_id } = req.params;
    const userModel = await userDatabase.get(user_id);

    if (!userModel) {
      throw new Error('USERS_INVALID_USER_ID');
    }

    const user = await UserLib.getUserFromModel(userModel, { currentUserId });
    res.status(200).send(user);
  } catch (error) {
    next(error);
  }
};

/**
 * 유저 검색하기
 * @route GET /api/users/search
 * @group users - 유저 관련
 * @param {string} keyword.required
 * @returns {Array.<User>} 200 - 검색된 유저 리스트
 * @returns {Error} 10604 - 400 잘못된 검색 쿼리입니다.
 */
export const searchUser: RequestHandler = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      throw new Error('USERS_INVALID_SEARCH_KEYWORD');
    }

    const keywordLowercase = keyword.toString().toLowerCase();

    const resultLimit = 10;
    const resultByUserId = await userDatabase.queryAllId((collection) =>
      collection
        .orderBy('user_id_lowercase')
        .startAt(keywordLowercase)
        .endAt(keywordLowercase + '\uf8ff')
        .limit(resultLimit),
    );
    const resultByUsername = await userDatabase.queryAllId((collection) =>
      collection
        .orderBy('username_lowercase')
        .startAt(keywordLowercase)
        .endAt(keywordLowercase + '\uf8ff')
        .limit(resultLimit),
    );

    const baseScore = 0;
    const maxScore = Math.max(resultByUserId.length, resultByUsername.length);
    let scoreTable: Record<string, number> = {};

    for (let i = 0; i < resultByUserId.length; i++) {
      const currentId = resultByUserId[i];
      const currentScore = maxScore - i;

      if (!scoreTable[currentId]) {
        scoreTable[currentId] = baseScore;
      }
      scoreTable[currentId] += currentScore;
    }

    for (let i = 0; i < resultByUsername.length; i++) {
      const currentId = resultByUsername[i];
      const currentScore = maxScore - i;

      if (!scoreTable[currentId]) {
        scoreTable[currentId] = baseScore;
      }
      scoreTable[currentId] += currentScore;
    }

    const result = Object.entries(scoreTable)
      .sort(([id1, score1], [id2, score2]) => score2 - score1)
      .slice(resultLimit)
      .map(([id, score]) => id);

    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 유저의 트윗 피드 가져오기 - 페이지네이션 (유저의 트윗 + 유저의 리트윗)
 * @route POST /api/users/{user_id}/feed
 * @group users - 유저 관련
 * @param {tweetFeedEntry.model} tweetFeedEntry.body - 트윗 피드 리스트 조건
 * @returns {TweetList} 200 - totalCount가 포함된 트윗 리스트
 */
export const getUserFeed: RequestHandler = async (req, res, next) => {
  try {
    const currentUserId = res.locals.user?.user_id;
    const { offset, count } = req.body;
    const { user_id } = req.params;
    const isValidUserId = await userDatabase.has(user_id);

    if (!isValidUserId) {
      throw new Error('USERS_INVALID_USER_ID');
    }

    const tweetModelList = await tweetDatabase.queryAll(
      (collection) =>
        collection
          .where('writer_id', '==', currentUserId)
          .orderBy('tweeted_at', 'desc')
          .limit(offset - 1 + count), // TODO: need to limit 'from'
    );

    const retweetModelList = await retweetDatabase.queryAll(
      (collection) =>
        collection
          .where('retweet_user_id', '==', currentUserId)
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

    const totalCount = getterList.length; // Tweet, Retweet

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

    const response: TweetList = {
      totalCount,
      data: feed,
    };

    res.status(200).send(response);
  } catch (error) {
    next(error);
  }
};

/**
 * 유저 팔로잉하기
 * @route POST /api/users/{user_id}/follow
 * @group users - 유저 관련
 * @returns {object} 201 - No Content
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10604 - 400 자기 자신을 팔로우할 수 없습니다.
 * @returns {Error} 10601 - 404 존재하지 않는 아이디입니다.
 * @returns {Error} 10602 - 400 이미 팔로잉 중입니다.
 */
export const followUser: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id: currentUserId } = res.locals.user;
    const { user_id: followedUserId } = req.params;

    if (currentUserId === followedUserId) {
      throw new Error('USERS_UNABLE_FOLLOW_SELF');
    }

    const followedUser = await userDatabase.get(followedUserId);

    if (!followedUser) {
      throw new Error('USERS_INVALID_USER_ID');
    }

    const newUserFollowId = UserLib.getUserFollowId(
      currentUserId,
      followedUserId,
    );
    const hasUserFollow = await userFollowDatabase.has(newUserFollowId);

    if (hasUserFollow) {
      throw new Error('USERS_FOLLOW_ALREADY_EXIST');
    }

    const newUserFollowModel: UserFollowModel = {
      following_user_id: currentUserId,
      followed_user_id: followedUserId,
      following_at: getCurrentDate(),
    };
    await userFollowDatabase.add(newUserFollowId, newUserFollowModel);

    res.status(201).send();
  } catch (error) {
    next(error);
  }
};

/**
 * 유저 팔로잉 취소
 * @route DELETE /api/users/{user_id}/follow
 * @group users - 유저 관련
 * @returns {object} 201 - No Content
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10601 - 404 존재하지 않는 아이디입니다.
 * @returns {Error} 10603 - 400 팔로잉 취소를 할 수 없습니다.
 */
export const unfollowUser: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id: currentUserId } = res.locals.user;
    const { user_id: followedUserId } = req.params;

    const followedUser = await userDatabase.get(followedUserId);

    if (!followedUser) {
      throw new Error('USERS_INVALID_USER_ID');
    }

    const userFollowId = UserLib.getUserFollowId(currentUserId, followedUserId);
    const hasUserFollow = await userFollowDatabase.has(userFollowId);

    if (!hasUserFollow) {
      throw new Error('USERS_FOLLOW_NO_EXIST');
    }
    await userFollowDatabase.remove(userFollowId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
