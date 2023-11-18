import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';

import { Logger } from '@utils/logging';
import { ApiError } from '@utils/errors';
import { createServer } from 'http';

export class ExpressApp {
  private readonly log = Logger.getLogger('api/express.ts');
  readonly app: express.Application;

  constructor() {
    this.app = express();

    // Disable x-powered-by header to reduce fingerprinting
    this.app.disable('x-powered-by');

    // Setup common security headers using helmet
    this.app.use(helmet());

    this.setupMorganRequestLogging();
  }

  private setupMorganRequestLogging() {
    // Setup morgan request logging for development
    const morganLogger = Logger.getLogger('morgan');
    this.app.use(
      morgan('dev', {
        stream: {
          write: (message: string) =>
            morganLogger.debug(message.replace('\n', '')),
        },
      }),
    );
  }

  private sendSingleErrorResponse(
    resp: express.Response,
    status: number,
    message: string,
  ) {
    resp.status(status).json({
      errors: [
        {
          status: status,
          message: message,
        },
      ],
    });
  }

  private expressErrorHandler(
    err: Error,
    req: express.Request,
    resp: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction,
  ) {
    if (err instanceof ApiError && err.status < 500) {
      this.sendSingleErrorResponse(resp, err.status, err.message);
    } else {
      this.sendSingleErrorResponse(resp, 500, 'An unknown error has occured');
      this.log.error('Unexpected error', err);
    }
  }

  private configureFinalMiddleware() {
    // 404 handler
    this.app.use((req, resp, next) => next(new ApiError(404, 'Not Found')));

    // Error Handler
    this.app.use(this.expressErrorHandler.bind(this));
  }

  listen(port: number) {
    this.configureFinalMiddleware();
    this.app.set('port', port);

    const httpServer = createServer(this.app);
    httpServer.listen(port, () => {
      this.log.info(`HTTP-Server live at http://127.0.0.1:${port}`);
    });
  }
}
