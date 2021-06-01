import { RequestHandler } from 'express';
import User from 'models/User';
import { databaseService } from '../firebase';
import * as AuthLib from './auth.lib';

export const currentUser: RequestHandler = async (req, res, next) => {
  try {
    if (!res.locals.user) {
      throw new Error('AUTH_NOT_LOGINED');
    }

    res.send(res.locals.user);
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    if (res.locals.user) {
      throw new Error('AUTH_ALREADY_LOGINED');
    }

    const { id: user_id, password } = req.body;
    const hashed_input_password = await AuthLib.createHash(password);

    const querySnapshot = await databaseService
      .collection('user')
      .where('user_id', '==', user_id)
      .where('hashed_password', '==', hashed_input_password)
      .get();

    if (querySnapshot.size != 1) {
      throw new Error('AUTH_INCORRECT_USER_ID_OR_PASSWORD');
    }

    const user = querySnapshot.docs[0].data() as User;
    const token = AuthLib.createToken(user);

    user.hashed_password = undefined;

    res.set('Authorization', `Bearer ${token}`);
    res.send(user);
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  res.set('Authorization', '');
  res.status(204).send();
};

export const signup: RequestHandler = async (req, res, next) => {
  try {
    if (res.locals.user) {
      throw new Error('AUTH_ALREADY_LOGINED');
    }

    const { id: user_id, password, username } = req.body;

    const isAlreadyExistUser = await databaseService
      .collection('user')
      .where('user_id', '==', user_id)
      .get()
      .then((querySnapshot) => !querySnapshot.empty)
      .catch(() => false);

    if (isAlreadyExistUser) {
      throw new Error('AUTH_USER_ID_ALREADY_EXIST');
    }

    const hashed_input_password = await AuthLib.createHash(password);
    const currentDate = Date();

    const newUser: User = {
      user_id: user_id,
      hashed_password: hashed_input_password,
      username: username,
      following_num: 0,
      follower_num: 0,
      created_at: currentDate,
      last_logined_at: currentDate,
    };

    await databaseService.collection('user').add(newUser);
    res.send(newUser);
  } catch (error) {
    next(error);
  }
};
