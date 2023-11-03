import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';

import { Logger } from '@utils/logging';

export function createApp(): express.Application {
  const app = express();

  // Disable x-powered-by header to reduce fingerprinting
  app.disable('x-powered-by');

  // Setup common security headers using helmet
  app.use(helmet());

  // Setup morgan request logging for development
  const morganLogger = Logger.getLogger('morgan');
  app.use(
    morgan('dev', {
      stream: {
        write: (message: string) =>
          morganLogger.debug(message.replace('\n', '')),
      },
    }),
  );

  return app;
}
