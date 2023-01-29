const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
const { TranslationServiceClient } = require('@google-cloud/translate').v3beta1;
const Joi = require('joi');
const { TranslationsService } = require('./translations');

functions.cloudEvent('translateDocument', async (cloudEvent) => {
  const file = cloudEvent.data;

  console.log('Received file', file);

  const envVarsSchema = Joi.object()
    .keys({
      TRANSLATED_DOCUMENTS_GCS_BUCKET: Joi.string().required(),
    })
    .unknown();

  const { value: envVars, error: envVarsError } = envVarsSchema.validate(
    process.env
  );

  if (envVarsError) {
    throw envVarsError;
  }

  const firestore = new Firestore();

  const storage = new Storage();

  const translationServiceClient = new TranslationServiceClient();

  const translationsService = new TranslationsService(
    firestore,
    storage,
    translationServiceClient,
    file.bucket,
    envVars.TRANSLATED_DOCUMENTS_GCS_BUCKET
  );

  const translationJobId = translationsService.getTranslationJobId(file.name);

  console.log('executing translation job:', translationJobId);

  try {
    await translationsService.executeTranslationJob(
      file.name,
      file.contentType
    );
  } catch (err) {
    try {
      await translationsService.updateTranslationJobStatus(
        translationJobId,
        'Error'
      );
    } catch (updateTranslationJobStatusErr) {
      console.error(
        'updateTranslationJobStatusErr',
        updateTranslationJobStatusErr
      );
    }
    throw err;
  }

  console.log(`translation job ${translationJobId} executed!`);
});
