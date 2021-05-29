import './env';
import express from 'express';
import cors from 'cors';
import { authService } from './firebase';

const app = express();
const port = 8000;

app.use(cors());

app.get('/', (req, res) => {
  console.log('/');
  res.send('Hello World');
});

app.get('/auth', (req, res) => {
  res.send(authService.currentUser);
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
