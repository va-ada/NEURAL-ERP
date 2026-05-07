const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId:     process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region:          process.env.AWS_REGION || 'ap-south-1',
});

const BUCKET = process.env.AWS_BUCKET_NAME;

const uploadToS3 = (file, key) =>
  s3.upload({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ServerSideEncryption: 'AES256',
  }).promise();

const deleteFromS3 = (key) =>
  s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();

const getSignedUrl = (fileUrl, expiresIn = 300) => {
  const key = fileUrl.split('.amazonaws.com/')[1];
  return s3.getSignedUrlPromise('getObject', { Bucket: BUCKET, Key: key, Expires: expiresIn });
};

module.exports = { uploadToS3, deleteFromS3, getSignedUrl };