import {Router} from 'express';
import {Socket} from 'socket.io';
import {celebrate, Joi, Segments} from 'celebrate';
import {StatusCodes} from 'http-status-codes';
import {TranslationsService} from './translations-service';
import {TranslationJob} from './translation-job';

class TranslationsRouter {
  private readonly ioSockets: string[] = [];

  constructor(private readonly translationService: TranslationsService) {}

  registerSocket(socket: Socket) {
    socket.on('translation-job-updates', async translationJobId => {
      console.log(
        `registering socket ${socket.id} to receive updates for translation job ${translationJobId}...`
      );

      const translationJobDoc =
        this.translationService.getTranslationJobDoc(translationJobId);

      console.log(
        `registering observer for translation job ${translationJobId}, to emit to socket ${socket.id}...`
      );

      const translationJobObserver = translationJobDoc.onSnapshot(snapshot => {
        console.log(
          `received snapshot for translation job ${translationJobId}, to emit to socket ${socket.id}`
        );

        const translationJobData = snapshot.data();

        if (!translationJobData) {
          throw new Error(`no data in the ${translationJobId} snapshot`);
        }

        const translationJob: TranslationJob = {
          id: snapshot.id,
          status: translationJobData.status,
          targetLanguageCode: translationJobData.targetLanguageCode,
          fileName: translationJobData.fileName,
          translatedFileName: translationJobData.translatedFileName,
        };

        console.log(
          `emitting translation job ${translationJob.id} update to socket ${socket.id}`,
          translationJob
        );

        socket.emit('translation-job-updates', translationJob);
      });

      socket.on('disconnect', () => {
        console.log(
          `closing observer for translation job ${translationJobId}, to emit to socket ${socket.id}...`
        );
        translationJobObserver();
      });
    });
  }

  get router() {
    const router = Router();

    router.post(
      '/translation-jobs',
      celebrate({
        [Segments.BODY]: Joi.object()
          .keys({
            targetLanguageCode: Joi.string().required(),
          })
          .required(),
      }),
      async (req, res, next) => {
        try {
          console.log('req.body', req.body);
          console.log('req.files', req.files);

          const {targetLanguageCode} = req.body;

          if (!req.files || Object.keys(req.files).length === 0) {
            throw new RangeError('no files were uploaded');
          }

          for (const filesKey of Object.keys(req.files)) {
            const uploadedFile = req.files[filesKey];

            if ('name' in uploadedFile && 'data' in uploadedFile) {
              const translationJob =
                await this.translationService.createTranslationJob({
                  targetLanguageCode,
                  fileName: uploadedFile.name,
                  data: uploadedFile.data,
                });

              res.status(StatusCodes.CREATED).json(translationJob);
            } else {
              throw new Error(
                "the uploaded file should contain the 'name' and 'data' properties."
              );
            }
          }
        } catch (err) {
          return next(err);
        }
      }
    );

    router.get('/supported-languages', async (req, res, next) => {
      try {
        const supportedLanguages =
          await this.translationService.getSupportedLanguages(req.locale);

        return res.json(supportedLanguages);
      } catch (err) {
        return next(err);
      }
    });

    router.get('/translation-jobs/:id/download', async (req, res, next) => {
      try {
        const {id: translationJobId} = req.params;

        const translatedFile = await this.translationService.getTranslatedFile(
          translationJobId
        );

        res.setHeader('Content-Type', translatedFile.file.metadata.contentType);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${translatedFile.translatedFileName}"`
        );

        translatedFile.file
          .createReadStream()
          .on('error', err => {
            throw err;
          })
          .on('end', () => {
            res.end();
          })
          .pipe(res);
      } catch (err) {
        next(err);
      }
    });

    return router;
  }
}

export {TranslationsRouter};
