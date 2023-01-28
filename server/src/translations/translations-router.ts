import {Router} from 'express';
import {celebrate, Joi, Segments} from 'celebrate';
import {StatusCodes} from 'http-status-codes';
import {TranslationsService} from './translations-service';
import {NotFoundError} from '../errors';
import {TranslationJob} from './translation-job';

class TranslationsRouter {
  constructor(private readonly translationService: TranslationsService) {}

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

    router.get('/translation-jobs/:id', async (req, res, next) => {
      try {
        const {id: translationJobId} = req.params;

        const translationJob = await this.translationService.getTranslationJob(
          translationJobId
        );

        if (!translationJob) {
          throw new NotFoundError(
            `translation job ${translationJobId} not found`
          );
        }

        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        res.write(`data: ${JSON.stringify(translationJob)}\n\n`);

        const translationJobDoc =
          this.translationService.getTranslationJobDoc(translationJobId);

        const translationJobObserver = translationJobDoc.onSnapshot(
          snapshot => {
            console.log(
              `received snapshot for translation job ${translationJobId}`
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

            res.write(`data: ${JSON.stringify(translationJob)}\n\n`);
          }
        );

        res.on('close', () => {
          console.log(
            `closing translationJobObserver for translation job ${translationJobId}`
          );
          translationJobObserver();
          res.end();
        });
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
