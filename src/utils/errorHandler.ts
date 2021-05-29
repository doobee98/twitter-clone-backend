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
};

const defaultErrorType = 'INTERNAL_SERVER_ERROR';

// TODO: 고도화 필요
export const handleError: ErrorRequestHandler = (err, req, res, next) => {
  const isDefinedError = err.code in errorDictionary;
  const errorType = isDefinedError ? err.code : defaultErrorType;

  const { statusCode, errorCode, msg } = errorDictionary[errorType];

  res.status(statusCode).json({
    errorCode,
    msg: isDefinedError ? msg : `${msg} - ${err.message}`,
  });
};
