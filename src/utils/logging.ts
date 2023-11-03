import winston from 'winston';

export interface ApplicationLogger  {
    getLogger(module: string): winston.Logger
}

class PrettyPrintConsoleLogger implements ApplicationLogger {
  private logger: winston.Logger;

  constructor(level: string) {
    this.logger = winston.createLogger({
      level: level,
      transports: [
        new winston.transports.Console({
          handleExceptions: true,
          handleRejections: true,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(
              ({ level, message, timestamp, module, ...metadata }) => {
                // Setup log format [Timestamp] [Log-Leve] [Module] : MESSAGE {METADATA}
                let msg = `${timestamp} [${level}] [${module}] : ${message} `;

                if (metadata) {
                  msg += JSON.stringify(metadata);
                }

                return msg;
              },
            ),
          ),
        }),
      ],
    });
  }

  getLogger(module: string): winston.Logger {
    return this.logger.child({ module });
  }
}

class JsonConsoleLogger implements ApplicationLogger {
  private logger: winston.Logger;

  constructor(level: string) {
    this.logger = winston.createLogger({
      level: level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          handleExceptions: true,
          handleRejections: true
        }),
      ],
    });
  }

  getLogger(module: string): winston.Logger {
    return this.logger.child({ module });
  }
}

export class Logger {
  private static instance: ApplicationLogger;

  private constructor() { }

  private static getLoggerInstance(): ApplicationLogger {
    if (!Logger.instance) {
      if (process.env.NODE_ENV !== 'production') {
          Logger.instance = new PrettyPrintConsoleLogger('debug')
      } else {
        Logger.instance = new JsonConsoleLogger('info')
      }
    }
    return Logger.instance;
  }

  public static getLogger(module: string): winston.Logger {
    return Logger.getLoggerInstance().getLogger(module);
  }
}
