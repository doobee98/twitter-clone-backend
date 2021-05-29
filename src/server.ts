import express from 'express';
import cors from 'cors';
import api from './api';
import { handleError } from './utils/errorHandler';

const app = express();

app.use(cors());
app.use(express.json()); // body-parser

app.use('/api', api);

app.use(handleError);

export default app;
