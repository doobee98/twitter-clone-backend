import { RequestHandler } from 'express';
import { User, UserModel } from 'models/User';
import * as UserLib from './user.lib';
import * as TweetLib from '../tweets/tweet.lib';
import {
  tweetDatabase,
  tweetLikeDatabase,
  userDatabase,
  userFollowDatabase,
} from '../firebase';
import { UserFollowModel } from 'models/UserFollow';
import { Tweet, TweetList, TweetModel } from 'models/Tweet';

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
 * 특정 유저의 트윗 피드 가져오기 - 페이지네이션
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
    const userModel = await userDatabase.get(user_id);

    if (!userModel) {
      throw new Error('USERS_INVALID_USER_ID');
    }

    const tweetIds = await tweetDatabase.queryAllId((collection) =>
      collection
        .where('writer_id', '==', user_id)
        .orderBy('tweeted_at', 'desc'),
    );

    const totalCount = tweetIds.length;
    const tweetModels = (
      await Promise.all(
        tweetIds
          .slice(offset - 1, offset - 1 + count)
          .map((id) => tweetDatabase.get(id)),
      )
    ).filter((t): t is TweetModel => t !== undefined);

    const tweets: Tweet[] = await Promise.all(
      tweetModels.map(async (tweetModel) => {
        return await TweetLib.getTweetFromModel(tweetModel, { currentUserId });
      }),
    );

    const response: TweetList = {
      totalCount,
      data: tweets,
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
      following_at: Date(),
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
