import { RequestHandler } from 'express';
import { User, UserModel } from 'models/User';
import { createHash, getCurrentDate } from '../../utils';
import {
  retweetDatabase,
  tweetLikeDatabase,
  userDatabase,
  userFollowDatabase,
} from '../firebase';
import * as AuthLib from './auth.lib';
import * as UserLib from '../users/user.lib';

// TODO: 테스트용 endpoint
export const currentUser: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    res.status(200).send(res.locals.user);
  } catch (error) {
    next(error);
  }
};

/**
 * 로그인
 * @route POST /api/auth/login
 * @group auth - 계정 관련
 * @param {LoginEntry.model} loginEntry.body - 로그인 입력
 * @returns {User.model} 200 - 해당 사용자 정보
 * @returns {Error} 10405 - 400 이미 로그인 되어 있습니다.
 * @returns {Error} 10402 - 400 존재하지 않는 아이디이거나 비밀번호가 잘못 입력되었습니다.
 */
export const login: RequestHandler = async (req, res, next) => {
  try {
    if (res.locals.user) {
      throw new Error('AUTH_ALREADY_LOGINED');
    }

    const { id, password } = req.body;
    const hashedInputPassword = await createHash(password);

    const userModel = await userDatabase.get(id);
    const isCorrectPassword =
      userModel?.hashed_password === hashedInputPassword;

    if (!userModel || !isCorrectPassword) {
      throw new Error('AUTH_INCORRECT_USER_ID_OR_PASSWORD');
    }

    const user = await UserLib.getUserFromModel(userModel, {
      currentUserId: id,
    });

    const token = AuthLib.createToken(user);
    res.set('Authorization', `Bearer ${token}`);
    res.status(200).send(user);
  } catch (error) {
    next(error);
  }
};

/**
 * 로그인 유저 정보 (자동로그인)
 * @route GET /api/auth/info
 * @group auth - 계정 관련
 * @returns {User.model} 200 - 해당 사용자 정보
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10403 - 401 로그인 정보가 훼손되었습니다.
 */
export const info: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id } = res.locals.user;
    const userModel = await userDatabase.get(user_id);

    if (!userModel) {
      throw new Error('AUTH_LOGIN_TOKEN_IS_COMPROMISED');
    }

    const user = await UserLib.getUserFromModel(userModel, {
      currentUserId: user_id,
    });

    res.status(200).send(user);
  } catch (error) {
    next(error);
  }
};

/**
 * 로그아웃
 * @route GET /api/auth/logout
 * @group auth - 계정 관련
 * @returns {object} 204 - No Content
 * @returns {Error} default - Unexpected error
 */
export const logout: RequestHandler = async (req, res, next) => {
  res.set('Authorization', '');
  res.status(204).send();
};

/**
 * 회원가입
 * @route POST /api/auth/signup
 * @group auth - 계정 관련
 * @param {signupEntry.model} signupEntry.body - 회원가입 입력
 * @returns {User.model} 201 - 해당 사용자 정보
 * @returns {Error} 10405 - 400 이미 로그인 되어 있습니다.
 * @returns {Error} 10401 - 400 이미 존재하는 아이디 입니다.
 * @returns {Error} 10407 - 400 회원가입 정보가 잘못되었습니다.
 * @returns {Error} 10408 - 400 사용할 수 없는 아이디입니다.
 */
export const signup: RequestHandler = async (req, res, next) => {
  try {
    if (res.locals.user) {
      throw new Error('AUTH_ALREADY_LOGINED');
    }

    const { id: newId, password, username } = req.body;

    if (AuthLib.isReservedUserId(newId)) {
      throw new Error('AUTH_RESERVED_USER_ID');
    }

    const isValidUserId = AuthLib.userIdRegex.test(newId);
    const isValidUsername = AuthLib.usernameRegex.test(username);
    const isValidPassword = AuthLib.passwordRegex.test(password);

    if (!isValidUserId || !isValidUsername || !isValidPassword) {
      throw new Error('AUTH_BAD_SIGNUP_PARAMS');
    }

    const isAlreadyExistUser = await userDatabase.has(newId);
    if (isAlreadyExistUser) {
      throw new Error('AUTH_USER_ID_ALREADY_EXIST');
    }

    const hashedInputPassword = await createHash(password);

    const newUserModel: UserModel = {
      user_id: newId,
      user_id_lowercase: newId.toLowerCase(),
      hashed_password: hashedInputPassword,
      username,
      username_lowercase: username.toLowerCase(),
      joined_at: getCurrentDate(),
    };

    await userDatabase.add(newId, newUserModel);
    res.status(201).send(newUserModel);
  } catch (error) {
    next(error);
  }
};

/**
 * 회원탈퇴
 * @route DELETE /api/auth/signout
 * @group auth - 계정 관련
 * @returns {object} 204 - No Content
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 */
export const signout: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id } = res.locals.user;

    await userDatabase.remove(user_id);

    // Retweet Database에서도 관련 내용 삭제
    const retweetIds = await retweetDatabase.queryAllId((collection) =>
      collection.where('retweet_user_id', '==', user_id),
    );

    Promise.all(retweetIds.map((id) => retweetDatabase.remove(id)));

    // TweetLike Database에서도 관련 내용 삭제
    const tweetLikeIds = await tweetLikeDatabase.queryAllId((collection) =>
      collection.where('user_id', '==', user_id),
    );

    Promise.all(tweetLikeIds.map((id) => tweetLikeDatabase.remove(id)));

    // UserFollow Database에서도 관련 내용 삭제
    const userFollowIds1 = await userFollowDatabase.queryAllId((collection) =>
      collection.where('following_user_id', '==', user_id),
    );
    const userFollowIds2 = await userFollowDatabase.queryAllId((collection) =>
      collection.where('followed_user_id', '==', user_id),
    );
    const userFollowIds = [...userFollowIds1, ...userFollowIds2];

    Promise.all(userFollowIds.map((id) => userFollowDatabase.remove(id)));
  } catch (error) {
    next(error);
  }
};

/**
 * 회원정보 변경
 * @route POST /api/auth/editInfo
 * @group auth - 계정 관련
 * @param {editInfoEntry.model} editInfoEntry.body - 회원정보 변경
 * @returns {User.model} 201 - 변경된 사용자 정보
 * @returns {Error} 10406 - 401 로그인이 필요합니다.
 * @returns {Error} 10402 - 400 존재하지 않는 아이디이거나 비밀번호가 잘못 입력되었습니다.
 */
export const editInfo: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    const { user_id: currentUserId } = res.locals.user;

    // const { username, profile_img_src, bio, website, location } = req.body;
    const editContent = req.body;
    await userDatabase.update(currentUserId, editContent);

    const newUserModel = await userDatabase.get(currentUserId);

    if (!newUserModel) {
      throw new Error('AUTH_INCORRECT_USER_ID_OR_PASSWORD');
    }

    const newUser = await UserLib.getUserFromModel(newUserModel, {
      currentUserId,
    });

    res.status(201).send(newUser);
  } catch (error) {
    next(error);
  }
};
