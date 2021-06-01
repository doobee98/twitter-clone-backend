import crypto from 'crypto';
import { RequestHandler } from 'express';
import { databaseService } from '../firebase';
import * as jwt from 'jsonwebtoken';
import User from 'models/User';
import config from '../../config';

interface JwtCertificate {
  user_id: number;
  iat: number;
  exp: number;
}

export const createHash = async (str: string): Promise<string> => {
  // TODO: salt 등으로 고도화 필요함
  return crypto.createHash('sha512').update(str).digest('base64');
};

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

    const querySnapshot = await databaseService
      .collection('user')
      .where('user_id', '==', user_id)
      .get();

    if (querySnapshot.size !== 1) {
      throw new Error('AUTH_LOGIN_TOKEN_IS_COMPROMISED');
    }

    const user = querySnapshot.docs[0].data() as User;

    res.locals.user = {
      user_id: user.user_id,
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
