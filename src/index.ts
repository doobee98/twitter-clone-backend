import './env';
import config from './config';
import './firebase';

import server from './server';
import logger from './utils/logger';

const port = config.port ?? 8000;

server.listen(port, () => {
  logger.debug(`app listening on port ${port}`);
});
