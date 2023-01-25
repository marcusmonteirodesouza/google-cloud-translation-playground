import {Router} from 'express';
import {celebrate, Joi, Segments} from 'celebrate';
import {StatusCodes} from 'http-status-codes';
import {TranslationService} from './translation-service';

class TranslationRouter {
  constructor(private readonly translationService: TranslationService) {}

  get router() {
    const router = Router();

    router.post(
      '/upload',
      celebrate({
        [Segments.QUERY]: Joi.object()
          .keys({
            targetLanguageCode: Joi.string().required(),
          })
          .required(),
      }),
      async (req, res, next) => {
        try {
          if (!req.files || Object.keys(req.files).length === 0) {
            throw new RangeError('no files were uploaded');
          }

          console.log('uploaded files', req.files);

          for (const filesKey of Object.keys(req.files)) {
            const uploadedFile = req.files[filesKey];

            if ('name' in uploadedFile && 'data' in uploadedFile) {
              const translationJobId =
                await this.translationService.createTranslationJob({
                  targetLanguageCode: req.query.targetLanguageCode as string,
                  fileName: uploadedFile.name,
                  data: uploadedFile.data,
                });

              res.status(StatusCodes.CREATED).json({translationJobId});
            } else {
              throw new Error(
                "the uploaded file should contain the 'name' and 'data' properties."
              );
            }
          }
        } catch (err) {
          next(err);
        }
      }
    );

    return router;
  }
}

export {TranslationRouter};
