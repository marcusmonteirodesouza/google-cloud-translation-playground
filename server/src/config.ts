import {Joi} from 'celebrate';

const envVarsSchema = Joi.object()
  .keys({
    PROJECT_ID: Joi.string().required(),
    GOOGLE_APPLICATION_CREDENTIALS: Joi.string(),
    NODE_ENV: Joi.string()
      .valid('development', 'test', 'production')
      .required(),
    PORT: Joi.number().integer().required(),
    DEFAULT_LOCALE: Joi.string().default('en'),
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
  nodeEnv: string;
  port: number;
  defaultLocale: string;
  translateDocumentsGCSBucket: string;
  translatedDocumentsGCSBucket: string;
}

const config: Config = {
  projectId: envVars.PROJECT_ID,
  port: envVars.PORT,
  defaultLocale: envVars.DEFAULT_LOCALE,
  nodeEnv: envVars.NODE_ENV,
  translateDocumentsGCSBucket: envVars.TRANSLATE_DOCUMENTS_GCS_BUCKET,
  translatedDocumentsGCSBucket: envVars.TRANSLATED_DOCUMENTS_GCS_BUCKET,
};

export {config};
