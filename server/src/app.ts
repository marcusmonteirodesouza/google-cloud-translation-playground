import * as express from 'express';
import {errorHandler} from './error-handler';

const app = express();

app.use(express.json());

app.use(
  async (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    await errorHandler.handleError(err, res);
  }
);

export {app};
