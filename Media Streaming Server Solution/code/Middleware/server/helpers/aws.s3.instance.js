const { S3 } = require('aws-sdk');
const configs = require('../../config/config');
const s3 = new S3({
  endpoint: configs.endpoint_url, // Put you region
  accessKeyId: configs.access_key, // Put you accessKeyId
  secretAccessKey: configs.secret_key, // Put you accessKeyId
  Bucket: configs.video_bucket, // Put your bucket name
  signatureVersion: 'v4',
  region: configs.region, // Put you region
  //   apiVersion: '2006-03-01'
});
module.exports = { s3 };
