const Joi = require('joi');

const envVarsSchema = Joi.object()
  .keys({
    // Server
    PORT: Joi.number().default(5000),

    // Database
    MONGO_URI: Joi.string()
      .required()
      .description('MongoDB connection URI'),

    // Auth
    JWT_SECRET: Joi.string()
      .required()
      .description('JWT secret key'),

    // n8n Webhook
    N8N_PRODUCTION_WEBHOOK_URL: Joi.string()
      .uri()
      .required()
      .description('n8n production webhook URL'),

    // Razorpay
    RAZORPAY_KEY_ID: Joi.string()
      .required()
      .description('Razorpay key ID'),

    RAZORPAY_KEY_SECRET: Joi.string()
      .required()
      .description('Razorpay key secret'),

    // AWS S3
    AWS_ACCESS_KEY_ID: Joi.string()
      .required()
      .description('AWS access key ID'),

    AWS_SECRET_ACCESS_KEY: Joi.string()
      .required()
      .description('AWS secret access key'),

    AWS_S3_BUCKET_NAME: Joi.string()
      .required()
      .description('AWS S3 bucket name'),

    AWS_REGION: Joi.string()
      .default('ap-south-1')
      .description('AWS region'),
  })
  .unknown(); // allow extra env vars (important)

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  // Server
  port: envVars.PORT,

  // Database
  mongoUri: envVars.MONGO_URI,

  // Auth
  jwtSecret: envVars.JWT_SECRET,

  // n8n
  n8nWebhookUrl: envVars.N8N_PRODUCTION_WEBHOOK_URL,

  // Razorpay
  razorpay: {
    keyId: envVars.RAZORPAY_KEY_ID,
    keySecret: envVars.RAZORPAY_KEY_SECRET,
  },

  // AWS
  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    bucketName: envVars.AWS_S3_BUCKET_NAME,
    region: envVars.AWS_REGION,
  },
};
