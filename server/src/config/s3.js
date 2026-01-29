const AWS = require('aws-sdk');

const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1',
};

const s3 = new AWS.S3(s3Config);

const bucketName = process.env.AWS_S3_BUCKET_NAME;



module.exports = {
  s3,
  bucketName,
};