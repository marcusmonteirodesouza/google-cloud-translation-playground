import http from 'http';
import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import locale from 'locale';
import {Server} from 'socket.io';
import {Firestore} from '@google-cloud/firestore';
import {Storage} from '@google-cloud/storage';
import {TranslationServiceClient} from '@google-cloud/translate';
import {TranslationsService, TranslationsRouter} from './translations';
import {errorHandler} from './error-handler';
import {config} from './config';

const app = express();

app.use(express.json());

app.use(cors());

app.use(fileUpload());

app.use(locale([], config.defaultLocale));

const firestore = new Firestore({
  projectId: config.projectId,
});

const storage = new Storage({
  projectId: config.projectId,
  apiEndpoint: config.gcsApiEndpoint,
});

const translationServiceClient = new TranslationServiceClient({
  projectId: config.projectId,
});

const translationsService = new TranslationsService({
  firestore,
  storage,
  translationServiceClient,
  translateDocumentsGCSBucket: config.translateDocumentsGCSBucket,
  translatedDocumentsGCSBucket: config.translatedDocumentsGCSBucket,
});

const translationsRouter = new TranslationsRouter(translationsService);

app.use(translationsRouter.router);

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

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', socket => {
  translationsRouter.registerSocket(socket);
});

export {server};
