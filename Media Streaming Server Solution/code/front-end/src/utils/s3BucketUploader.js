import axios from 'axios';
import { request } from '../utils/request';
// import { v4 as uuidv4 } from 'uuid';

export default async function S3BucketUploader({
  videoFile,
  keyPrefix,
  callBack,
}) {
  try {
    if (videoFile) {
      let progress = 0.0;
      const size = videoFile.size;
      const FILE_CHUNK_SIZE = 10 ** 7;
      const metadata = {
        path: '/videos/get-video-upload-url',
        method: 'POST',
      };
      const productImageKey = `${videoFile.name}`;
      const data = {
        key: productImageKey,
        type: videoFile.type,
        numberOfparts: Math.ceil(size / FILE_CHUNK_SIZE),
      };

      const {
        data: { urls, UploadId },
      } = await request(metadata, data, true);
      const keys = Object.keys(urls);
      const promises = [];
      var options = {
        headers: {
          'Content-Type': videoFile.type,
        },
      };
      await Promise.all(
        keys.map(async (_key, indexStr) => {
          const index = parseInt(indexStr);
          const start = index * FILE_CHUNK_SIZE;
          const end = (index + 1) * FILE_CHUNK_SIZE;
          const blob =
            index < keys.length
              ? videoFile.slice(start, end)
              : videoFile.slice(start);
          const _result = await axios.put(urls[index], blob, options);
          promises.push({
            ETag: _result.headers.etag,
            PartNumber: indexStr + 1,
          });
          progress = progress + 100 / Math.ceil(size / FILE_CHUNK_SIZE);
          callBack(progress);
          // await promises.push(axios.put(urls[index], blob));
        })
      );
      // for (const indexStr of keys) {
      //   const index = parseInt(indexStr);
      //   const start = index * FILE_CHUNK_SIZE;
      //   const end = (index + 1) * FILE_CHUNK_SIZE;
      //   const blob =
      //     index < keys.length
      //       ? videoFile.slice(start, end)
      //       : videoFile.slice(start);

      //   promises.push(axios.put(urls[index], blob));
      // }
      // const resParts = await Promise.all(promises);

      // const parts = promises.map((part, index) => ({
      //   ETag: part.headers.etag,
      //   PartNumber: index + 1,
      // }));
      const end_metadata = {
        path: '/videos/completeMultiUpload',
        method: 'POST',
      };
      const _data = {
        UploadId,
        parts: promises,
        key: productImageKey,
      };

      const result = await request(end_metadata, _data, false);
      return result;
    }
    // return null;
  } catch (error) {
    console.log(error);
    return null;
  }
}
