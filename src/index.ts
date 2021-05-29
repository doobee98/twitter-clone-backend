import express from 'express';
import cors from 'cors';

const app = express();
const port = 8000;

app.use(cors());

app.get('/', (req, res) => {
  console.log('/');
  res.send('Hello World');
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
