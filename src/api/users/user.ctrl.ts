import { RequestHandler } from 'express';
import { User, UserModel } from 'models/User';
import { userDatabase } from '../firebase';

/**
 * 유저 정보 가져오기
 * @route GET /api/users/{user_id}
 * @group users - 유저 관련
 * @returns {User.model} 200 - 해당 트윗 정보
 * @returns {Error} 10505 - 404 존재하지 않는 아이디입니다.
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
