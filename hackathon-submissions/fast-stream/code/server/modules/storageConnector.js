const {
  S3Client,
  ListBucketsCommand,
  ListObjectsCommand,
  HeadObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");
const errorLogger = require("./errorLogger");

// Initialise the needed config values from env variables
const endpoint = process.env.AWS_ENDPOINT || "https://s3.ap-southeast-1.lyvecloud.seagate.com";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || "ap-southeast-1";

// Setup config object
const configs = {
  // endpoint: "https://s3.ap-southeast-1.lyvecloud.seagate.com",
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  region: region,
};

// Instantiate the S3 Client object
const client = new S3Client(configs);

// All Cloud S3 interfacing operations below
/**
 * @module storageConnector
 *
 * @method getStats
 * @method getAllBuckets
 * @method getAllMedia
 * @method getMediaSize
 * @method getMediaNormal
 */

exports.getStats = function () {
  return {
    endpoint: configs.endpoint,
    region: configs.region
  };
}

/**
 * Gets a list of all the buckets from S3.
 *
 * Important attributes in the successful response object are `$metadata.httpStatusCode` and `Buckets`.
 *
 * @async
 *
 * @throws Error from sending ListBucketsCommand object to S3.
 *
 * @returns {Promise<{"$metadata": {httpStatusCode: number}, Buckets: Object[]}>} Response from ListBucketsCommand.
 */
exports.getAllBuckets = async function () {
  try {
    let data = await client.send(new ListBucketsCommand({}));
    return data;
  } catch (err) {
    errorLogger.log(err);
    throw err;
  }
};

/**
 * Gets a list of all the media from the specified bucket in the connected S3.
 *
 * Important attributes in the successful response object are `$metadata.httpStatusCode` and `Contents`.
 *
 * @async
 *
 * @param {string} bucketName The specified bucket to retrieve media from.
 *
 * @throws Error from sending ListObjectsCommand object to S3.
 *
 * @returns {Promise<{"$metadata": {httpStatusCode: number}, Contents: Object[]}>} Response from ListObjectsCommand.
 */
exports.getAllMedia = async function (bucketName) {
  try {
    let truncated = true;
    let pageMarker;
    let details = {
      Bucket: bucketName,
    };
    let data = [];
    while (truncated) {
      try {
        const response = await client.send(new ListObjectsCommand(details));
        response.Contents.forEach((item) => {
          data.push(item);
        });
        truncated = response.IsTruncated;
        if (truncated) {
          pageMarker = response.Contents.slice(-1)[0].Key;
          details.Marker = pageMarker;
        } else {
          response.Contents = data;
          return response;
        }
      } catch (err) {
        errorLogger.log(`Error ${err}`);
        truncated = false;
      }
    }
  } catch (err) {
    errorLogger.log(err);
    throw err;
  }
};

/**
 * Gets the metadata of the specified media from the specified bucket in the connected S3.
 *
 * @async
 *
 * @param {string} bucketName The specified bucket to retrieve media metadata from.
 * @param {string} mediaName The specified media whose metadata to retrieve.
 *
 * @throws Error from sending HeadObjectCommand object to S3.
 *
 * @returns {Promise<?number>} The ContentLength value from the Response of the HeadObjectCommand if the Response has a 200 status code, `null` otherwise.
 */
exports.getMediaSize = async function (bucketName, mediaName) {
  try {
    let details = {
      Bucket: bucketName,
      Key: mediaName,
    };
    let data = await client.send(new HeadObjectCommand(details));
    if (data["$metadata"].httpStatusCode !== 200) {
      return null;
    } else {
      return data.ContentLength;
    }
  } catch (err) {
    errorLogger.log(err);
    throw err;
  }
};

/**
 * Gets the specified media from the specified bucket in the connected S3 in chunks without any special protocol.
 *
 * Important attributes in the successful response object are `$metadata.httpStatusCode` and `Body`.
 *
 * The `Body` attribute of the successful response object is a ReadableStream.
 *
 * @async
 *
 * @param {string} bucketName The specified bucket to retrieve media from.
 * @param {string} mediaName The specified media to retrieve.
 * @param {number} start The starting byte of the media chunk to stream.
 * @param {?number} [end=null] The ending byte of the media chunk to stream.
 *
 * @throws Error from sending GetObjectCommand object to S3.
 *
 * @returns {Promise<{"$metadata": {httpStatusCode: number}, Body: ReadableStream}>} The Response of the GetObjectCommand.
 */
exports.getMediaNormal = async function (
  bucketName,
  mediaName,
  start,
  end = null
) {
  try {
    // const streamToBuffer = (stream) => {
    //     new Promise((resolve, reject) => {
    //         const chunks = [];
    //         stream.on("data", (chunk) => chunks.push(chunk));
    //         stream.on("error", reject);
    //         stream.on("end", () => resolve(new Buffer.concat(chunks)));
    //     });
    // };
    let details;
    if (end === null) {
      details = {
        Bucket: bucketName,
        Key: mediaName,
      };
    } else {
      details = {
        Bucket: bucketName,
        Key: mediaName,
        Range: `bytes=${String(start)}-${String(end)}`,
      };
    }
    let data = await client.send(new GetObjectCommand(details));
    return data;
  } catch (err) {
    errorLogger.log(err);
    throw err;
  }
};

// async function postBucket(bucketName) {
//     try {
//         let details = {
//             Bucket: bucketName
//         };
//         let data = await client.send(new CreateBucketCommand(details));
//         console.log("Success >\n", data);
//         return;
//     } catch (err) {
//         console.error(err);
//     }
// }

// async function postMedia(bucketName, mediaSourceName, mediaTargetName) {
//     try {
//         let fileData = fs.readFileSync(`../media/${mediaSourceName}`);
//         let details = {
//             Bucket: bucketName,
//             Key: mediaTargetName,
//             Body: fileData
//         };
//         let data = await client.send(new PutObjectCommand(details));
//         console.log("Success >\n", data);
//         return;
//     } catch (err) {
//         console.error(err);
//     }
// }

// async function deleteMedia(bucketName, mediaName) {
//     try {
//         let details = {
//             Bucket: bucketName,
//             Key: mediaName
//         };
//         let data = await client.send(new DeleteObjectCommand(details));
//         console.log("Success >\n", data);
//         return;
//     } catch (err) {
//         console.error(err);
//     }
// }

// postMedia("s-mediastore", "170724_15_Setangibeach.mp4", "170724_15_Setangibeach.mp4")
// .then((res) => {
//   console.log("1");
//   postMedia("s-mediastore", "kier-in-sight-ioSyqyVQDdk-unsplash.jpeg", "kier-in-sight-ioSyqyVQDdk-unsplash.jpeg")
//   .then((res) => {
//     console.log("2");
//     postMedia("s-mediastore", "slow-trap-18565.mp3", "slow-trap-18565.mp3")
//     .then((res) => {
//       console.log("Done!");
//     })
//     .catch((err) => {
//       console.error(err);
//     });
//   })
//   .catch((err) => {
//     console.error(err);
//   });
// })
// .catch((err) => {
//   console.error(err);
// });
