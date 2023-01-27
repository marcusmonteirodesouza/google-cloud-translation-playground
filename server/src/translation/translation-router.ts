import {Router} from 'express';
import {celebrate, Joi, Segments} from 'celebrate';
import {StatusCodes} from 'http-status-codes';
import {TranslationService} from './translation-service';

class TranslationRouter {
  constructor(private readonly translationService: TranslationService) {}

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

    router.get('/translation-jobs/:id', async (req, res, next) => {
      try {
        const {id: translationJobId} = req.params;

        const translationJob = await this.translationService.getTranslationJob(
          translationJobId
        );

        return res.json(translationJob);
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

        res.setHeader('Content-Type', translatedFile.metadata['contentType']);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${translatedFile.name}"`
        );

        translatedFile
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

export {TranslationRouter};
