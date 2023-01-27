import {Joi} from 'celebrate';

const envVarsSchema = Joi.object()
  .keys({
    PROJECT_ID: Joi.string().required(),
    FIRESTORE_EMULATOR_HOST: Joi.string(),
    GCS_API_ENDPOINT: Joi.string().default('storage.googleapis.com'),
    PORT: Joi.number().integer().required(),
    TRANSLATE_DOCUMENTS_GCS_BUCKET: Joi.string().required(),
    TRANSLATED_DOCUMENTS_GCS_BUCKET: Joi.string().required(),
  })
  .unknown();

const {value: envVars, error} = envVarsSchema.validate(process.env);

if (error) {
  throw error;
}

interface Config {
  projectId: string;
  firestoreEmulatorHost: string;
  gcsApiEndpoint: string;
  port: number;
  translateDocumentsGCSBucket: string;
  translatedDocumentsGCSBucket: string;
}

const config: Config = {
  projectId: envVars.PROJECT_ID,
  firestoreEmulatorHost: envVars.FIRESTORE_EMULATOR_HOST,
  gcsApiEndpoint: envVars.GCS_EMULATOR_HOST,
  port: envVars.PORT,
  translateDocumentsGCSBucket: envVars.TRANSLATE_DOCUMENTS_GCS_BUCKET,
  translatedDocumentsGCSBucket: envVars.TRANSLATED_DOCUMENTS_GCS_BUCKET,
};

export {config};
