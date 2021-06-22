import config from '../config';
import { Express } from 'express';

// https://github.com/pgroot/express-swagger-generator
const swaggerDefinition = {
  info: {
    title: 'Twitter-Clone API Swagger',
    version: '1.0.0',
    description: 'API endpoints of Twitter-Clone Project Backend',
  },
  host: 'localhost:8000',
  basePath: '/',
  //   securityDefinitions: {
  //     Bearer: {
  //       type: 'apiKey',
  //       name: 'Authorization',
  //       in: 'header',
  //     },
  //   },
  //   security: [{ Bearer: [] }],
  defaultSecurity: 'Bearer',
};

const swaggerOptions = {
  swaggerDefinition,
  basedir: __dirname,
  files:
    config.nodeEnv === 'development'
      ? ['../models/**/*.ts', '../api/**/*.ts', './swaggerType.ts']
      : ['../models/**/*.js', '../api/**/*.js', './swaggerType.js'],
};

const activateSwagger = (app: Express): void => {
  if (config.nodeEnv !== 'production') {
    // express-swagger-generator는 @types가 없어 import 불가능
    const expressSwagger = require('express-swagger-generator')(app);
    expressSwagger(swaggerOptions);
  }
};

export default activateSwagger;
