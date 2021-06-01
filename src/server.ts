import express from 'express';
import cors from 'cors';
import api from './api';
import { checkAuthToken } from './api/auth/auth.lib';
import { handleError } from './utils/errorHandler';
import activateSwagger from './utils/activateSwagger';

const app = express();

// middlewares
app.use(
  cors({
    exposedHeaders: ['Authorization'],
  }),
);
app.use(express.json()); // body-parser
app.use(checkAuthToken);

// routing
app.use('/api', api);

// error handler
app.use(handleError);

// swagger utils
activateSwagger(app);

export default app;
