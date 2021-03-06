import { RequestHandler } from 'express';
import { userDatabase } from '../firebase';
import * as jwt from 'jsonwebtoken';
import { User } from 'models/User';
import config from '../../config';

const invalidUserIdList = [
  'search',
  'test',
  'login',
  'home',
  'explore',
  'notifications',
  'messages',
  'bookmarks',
  'lists',
  'i',
];

export const userIdRegex = /^[a-zA-Z0-9]{4,10}$/;
export const passwordRegex = /^[a-zA-Z0-9!@#$%^&+=]{4,15}$/;
export const usernameRegex = /^[a-zA-Z0-9!@#$%^&+=ㄱ-ㅎㅏ-ㅣ가-힣]{2,10}$/;

export const isReservedUserId = (userId: string) => {
  return invalidUserIdList.includes(userId.toLowerCase());
};

interface JwtCertificate {
  user_id: string;
  iat: number;
  exp: number;
}

export const createToken = (user: User): string => {
  if (!config.jwtSecretKey) {
    return '';
  }

  return jwt.sign(
    {
      user_id: user.user_id,
    },
    config.jwtSecretKey,
  );
};

export const checkAuthToken: RequestHandler = async (req, res, next) => {
  const bearerToken = req.headers.authorization;

  if (!config.jwtSecretKey) {
    next();
    return;
  }

  if (!bearerToken) {
    next();
    return;
  }

  const [bearer, token] = bearerToken.split(' ');
  if (bearer !== 'Bearer' || !token || token === '') {
    next();
    return;
  }

  try {
    const { user_id } = jwt.verify(
      token,
      config.jwtSecretKey,
    ) as JwtCertificate;

    const hasUser = await userDatabase.has(user_id);
    if (!hasUser) {
      throw new Error('AUTH_LOGIN_TOKEN_IS_COMPROMISED');
    }

    res.locals.user = {
      user_id,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next();
      return;
    }
    if (error.name === 'TokenExpiredError') {
      next(new Error('AUTH_LOGIN_TOKEN_IS_EXPIRED'));
      return;
    }

    // 토큰 검증 실패
    res.set('Authorization', '');
    next(error);
  }
};
