import Joi from 'joi';

const envVarsSchema = Joi.object()
  .keys({
    REACT_APP_API_BASE_URL: Joi.string().uri().required(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
  throw error;
}

const config = {
  apiBaseUrl: envVars.REACT_APP_API_BASE_URL,
};

export { config };
