const Joi = require('joi');

const envVarsSchema = Joi.object()
  .keys({
    PORT: Joi.number().default(5000),
    MONGO_URI: Joi.string().required().description('MongoDB connection URI'),
    // JWT_SECRET: Joi.string().required().min(32).description('JWT secret key'),
  })
  .unknown(); // allow other vars if needed later

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  port: envVars.PORT,
  mongoUri: envVars.MONGO_URI,
  jwtSecret: envVars.JWT_SECRET,
};