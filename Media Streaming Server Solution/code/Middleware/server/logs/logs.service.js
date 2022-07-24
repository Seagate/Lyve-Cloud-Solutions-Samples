const configs = require('../../config/config');
const { s3 } = require('../helpers/aws.s3.instance');

async function saveLog(_data) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(_data);
      const bucketParams = {
        Bucket: configs.audit_logs_bucket,
        Key: `${new Date()}`,
        Body: JSON.stringify(_data),
      };
      s3.upload(bucketParams, async function (err, data) {
        if (err) {
          console.log('Error', err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}
async function getLogs() {
  return new Promise(async (resolve, reject) => {
    try {
      const bucketParams = {
        Bucket: configs.audit_logs_bucket,
      };
      s3.listObjects(bucketParams, async function (err, data) {
        if (err) {
          console.log('Error', err);
          reject(err);
        } else {
          resolve(data.Contents);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}
async function getLog({ key }) {
  return new Promise(async (resolve, reject) => {
    try {
      const bucketParams = {
        Bucket: configs.audit_logs_bucket,
        Key: key,
      };
      s3.getObject(bucketParams, async function (err, data) {
        if (err) {
          console.log('Error', err);
          reject(err);
        } else {
          resolve({
            ...JSON.parse(data.Body.toString('utf-8')),
            timeStamp: key,
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}
async function deleteLogs({ key }) {
  return new Promise(async (resolve, reject) => {
    try {
      const bucketParams = {
        Bucket: configs.audit_logs_bucket,
      };
      s3.getObject(bucketParams, async function (err, data) {
        if (err) {
          console.log('Error', err);
          reject(err);
        } else {
          resolve({
            ...JSON.parse(data.Body.toString('utf-8')),
            timeStamp: key,
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}
module.exports = {
  saveLog,
  getLogs,
  getLog,
  deleteLogs,
};
