import { ErrorRequestHandler } from 'express';

interface ErrorResponse {
  statusCode: number;
  errorCode: number;
  msg: string;
}

const errorDictionary: Record<string, ErrorResponse> = {
  INTERNAL_SERVER_ERROR: {
    statusCode: 500,
    errorCode: 0,
    msg: 'Internal Server Error',
  },
  AUTH_USER_ID_ALREADY_EXIST: {
    statusCode: 400,
    errorCode: 10401,
    msg: '이미 존재하는 아이디 입니다.',
  },
  AUTH_INCORRECT_USER_ID_OR_PASSWORD: {
    statusCode: 400,
    errorCode: 10402,
    msg: '존재하지 않는 아이디이거나 비밀번호가 잘못 입력되었습니다.',
  },
  AUTH_LOGIN_TOKEN_IS_COMPROMISED: {
    statusCode: 401,
    errorCode: 10403,
    msg: '로그인 정보가 훼손되었습니다.',
  },
  AUTH_LOGIN_TOKEN_IS_EXPIRED: {
    statusCode: 401,
    errorCode: 10404,
    msg: '로그인 정보가 만료되었습니다.',
  },
  AUTH_ALREADY_LOGINED: {
    statusCode: 400,
    errorCode: 10405,
    msg: '이미 로그인 되어 있습니다.',
  },
  AUTH_NOT_LOGINED: {
    statusCode: 401,
    errorCode: 10406,
    msg: '로그인이 필요합니다.',
  },
  TWEETS_NOT_EXIST: {
    statusCode: 404,
    errorCode: 10501,
    msg: '존재하지 않는 트윗입니다.',
  },
  TWEETS_NO_EDIT_PERMISSION: {
    statusCode: 401,
    errorCode: 10502,
    msg: '해당 트윗 수정 권한이 없습니다.',
  },
  TWEETS_NO_EDIT_CONTENT: {
    statusCode: 400,
    errorCode: 10503,
    msg: '트윗 변경 사항이 없습니다.',
  },
  TWEETS_LIKE_ALREADY_EXIST: {
    statusCode: 400,
    errorCode: 10504,
    msg: '이미 좋아요를 누른 트윗입니다.',
  },
  TWEETS_LIKE_NO_EXIST: {
    statusCode: 400,
    errorCode: 10505,
    msg: '좋아요 취소를 할 수 없는 트윗입니다.',
  },
  USERS_INVALID_USER_ID: {
    statusCode: 404,
    errorCode: 10601,
    msg: '존재하지 않는 아이디입니다.',
  },
  USERS_FOLLOW_ALREADY_EXIST: {
    statusCode: 400,
    errorCode: 10602,
    msg: '이미 팔로잉 중입니다.',
  },
  USERS_FOLLOW_NO_EXIST: {
    statusCode: 400,
    errorCode: 10603,
    msg: '팔로잉 취소를 할 수 없습니다.',
  },
  USERS_UNABLE_FOLLOW_SELF: {
    statusCode: 400,
    errorCode: 10604,
    msg: '자기 자신을 팔로우할 수 없습니다.',
  },
};

const defaultErrorType = 'INTERNAL_SERVER_ERROR';

// TODO: 고도화 필요
export const handleError: ErrorRequestHandler = (err, req, res, next) => {
  const isDefinedError = err.message in errorDictionary;
  const errorType = isDefinedError ? err.message : defaultErrorType;

  const { statusCode, errorCode, msg } = errorDictionary[errorType];

  res.status(statusCode).json({
    errorCode,
    msg: isDefinedError ? msg : `${msg} - ${err.message}`,
  });
};
