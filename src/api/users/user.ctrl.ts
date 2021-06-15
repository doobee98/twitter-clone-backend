import { RequestHandler } from 'express';
import { User, UserModel } from 'models/User';
import * as UserLib from './user.lib';
import { userDatabase, userFollowDatabase } from '../firebase';
import { UserFollowModel } from 'models/UserFollow';

/**
 * 유저 정보 가져오기
 * @route GET /api/users/{user_id}
 * @group users - 유저 관련
 * @returns {User.model} 200 - 해당 트윗 정보
 * @returns {Error} 10601 - 404 존재하지 않는 아이디입니다.
 */
export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const userModel = await userDatabase.get(user_id);

    if (!userModel) {
      throw new Error('USERS_INVALID_USER_ID');
    }

    const user: User = {
      ...userModel,
      hashed_password: undefined,
    };

    res.status(200).send(user);
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
 * @returns {Error} 10601 - 404 존재하지 않는 아이디입니다.
 * @returns {Error} 10602 - 400 이미 팔로잉 중입니다.
 */
export const followUser: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id } = res.locals.user;
    const { user_id: follow_user_id } = req.params;
    const hasFollowUser = await userDatabase.has(follow_user_id);

    if (!hasFollowUser) {
      throw new Error('USERS_INVALID_USER_ID');
    }

    const newUserFollowId = UserLib.getUserFollowId(user_id, follow_user_id);
    const hasUserFollow = await userFollowDatabase.has(newUserFollowId);

    if (hasUserFollow) {
      throw new Error('USERS_FOLLOW_ALREADY_EXIST');
    }

    const newUserFollowModel: UserFollowModel = {
      following_user_id: user_id,
      followed_user_id: follow_user_id,
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

    const { user_id } = res.locals.user;
    const { user_id: follow_user_id } = req.params;
    const hasFollowUser = await userDatabase.has(follow_user_id);

    if (!hasFollowUser) {
      throw new Error('USERS_INVALID_USER_ID');
    }

    const userFollowId = UserLib.getUserFollowId(user_id, follow_user_id);
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
