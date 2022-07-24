const Joi = require('joi');

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  ACCESS_KEY: Joi.string().required().description('Access key is required'),
  PORT: Joi.number().default(4040),
  SECRET_KEY: Joi.string().required().description('Secret key is required'),
  ENDPOINT_URL: Joi.string().required().description('End point is required'),
  REGION: Joi.string().required().description('Region is required!'),
  AUDIT_LOGS_BUCKET: Joi.string()
    .required()
    .description('Audit logs bucket is required!'),
  NEW_BUCKET: Joi.string()
    .required()
    .description('Video bucket api key is required!'),
})
  .unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  access_key: envVars.ACCESS_KEY,
  port: envVars.PORT,
  secret_key: envVars.SECRET_KEY,
  endpoint_url: envVars.ENDPOINT_URL,
  region: envVars.REGION,
  audit_logs_bucket: envVars.AUDIT_LOGS_BUCKET,
  video_bucket: envVars.NEW_BUCKET,
};

module.exports = config;
