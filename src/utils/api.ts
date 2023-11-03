import {
  NextFunction,
  ParamsDictionary,
  Request,
  RequestHandler,
  Response,
} from 'express-serve-static-core';
import { ParsedQs } from 'qs';

/**
 * Wraps an async express request handler to forward any errors to the next handler.
 */
export function asyncRequestHandler<
  P = ParamsDictionary,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResBody = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReqBody = any,
  ReqQuery = ParsedQs,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LocalsObj extends Record<string, any> = Record<string, any>,
>(
  handler: (
    req: Request<P, ResBody, ReqBody, ReqQuery, LocalsObj>,
    res: Response<ResBody, LocalsObj>,
    next: NextFunction,
  ) => Promise<void>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj> {
  return (req, resp, next) => {
    handler(req, resp, next).catch((err) => next(err));
  };
}
