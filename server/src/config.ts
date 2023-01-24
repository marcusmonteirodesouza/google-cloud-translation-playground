import {Joi} from 'celebrate';

const envVarsSchema = Joi.object()
  .keys({
    PORT: Joi.number().integer().required(),
  })
  .unknown();

const {value: envVars, error} = envVarsSchema.validate(process.env);

if (error) {
  throw error;
}

const config = {
  port: envVars.PORT,
};

export {config};
