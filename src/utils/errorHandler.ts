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
    statusCode: 404,
    errorCode: 10401,
    msg: '이미 존재하는 아이디 입니다.',
  },
  AUTH_INCORRECT_USER_ID_OR_PASSWORD: {
    statusCode: 404,
    errorCode: 10402,
    msg: '존재하지 않는 아이디이거나 비밀번호가 잘못 입력되었습니다.',
  },
  AUTH_LOGIN_TOKEN_IS_COMPROMISED: {
    statusCode: 404,
    errorCode: 10403,
    msg: '로그인 정보가 훼손되었습니다.',
  },
  AUTH_LOGIN_TOKEN_IS_EXPIRED: {
    statusCode: 404,
    errorCode: 10404,
    msg: '로그인 정보가 만료되었습니다.',
  },
  AUTH_ALREADY_LOGINED: {
    statusCode: 404,
    errorCode: 10405,
    msg: '이미 로그인 되어 있습니다.',
  },
  AUTH_NOT_LOGINED: {
    statusCode: 404,
    errorCode: 10406,
    msg: '로그인이 필요합니다.',
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