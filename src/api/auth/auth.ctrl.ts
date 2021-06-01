import { RequestHandler } from 'express';
import User from 'models/User';
import { userDatabase } from '../firebase';
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

    const { id, password } = req.body;
    const hashedInputPassword = await AuthLib.createHash(password);

    const user = await userDatabase.get(id);
    const isCorrectPassword = user?.hashed_password === hashedInputPassword;

    if (!user || !isCorrectPassword) {
      throw new Error('AUTH_INCORRECT_USER_ID_OR_PASSWORD');
    }

    user.hashed_password = undefined;

    const token = AuthLib.createToken(user);
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

    const { id: newId, password, username } = req.body;

    const isAlreadyExistUser = (await userDatabase.get(newId)) !== undefined;
    if (isAlreadyExistUser) {
      throw new Error('AUTH_USER_ID_ALREADY_EXIST');
    }

    const hashedInputPassword = await AuthLib.createHash(password);
    const currentDate = Date();

    const newUser: User = {
      user_id: newId,
      hashed_password: hashedInputPassword,
      username,
      following_num: 0,
      follower_num: 0,
      created_at: currentDate,
      last_logined_at: currentDate,
    };

    await userDatabase.add(newId, newUser);
    res.send(newUser);
  } catch (error) {
    next(error);
  }
};
