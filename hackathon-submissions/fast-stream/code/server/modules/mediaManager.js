const { exit } = require("process");
const fs = require("fs");
const Database = require("better-sqlite3");
const storageConnector = require("./storageConnector");
const { imageMap, audioMap, videoMap } = require("./MIMEMap");
const errorLogger = require("./errorLogger");

// Instantiate the SQLite DB connection

/**
 * Creates new tables for the SQLite database.
 *
 * @param {Database} newDb The database to initialize and set up.
 *
 * @throws Error in creating new tables as the tables already exist.
 */
function createTables(newDb) {
  newDb.exec(`
    CREATE TABLE bucket (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL UNIQUE,
        path TEXT NOT NULL UNIQUE
    );

    CREATE TABLE media (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        size INTEGER NOT NULL,
        extension TEXT NOT NULL,
        count INTEGER NOT NULL,
        bucket_id INTEGER NOT NULL,
        FOREIGN KEY(bucket_id) REFERENCES bucket(id) ON DELETE CASCADE
    );

    CREATE TABLE local_store (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name TEXT NOT NULL UNIQUE,
        chunk_size INTEGER NOT NULL,
        media_id INTEGER NOT NULL,
        bucket_id INTEGER NOT NULL,
        FOREIGN KEY(media_id) REFERENCES media(id) ON DELETE CASCADE, 
        FOREIGN KEY(bucket_id) REFERENCES bucket(id) ON DELETE CASCADE
    );

    CREATE TABLE queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        media_id INTEGER NOT NULL,
        is_image INTEGER NOT NULL, 
        size INTEGER NOT NULL
    )
    `);
}

let db;
try {
  db = new Database("server/data/faststream.db");
} catch (err) {
  errorLogger.log(err);
}

try {
  createTables(db);
} catch (err) {
  errorLogger.log(err);
}

// All operations of the interface that synchronises cached and non-cached data below
/**
 * @module mediaManager
 *
 * @method getStats
 * @method getAllBuckets
 * @method getAllBucketsHard
 * @method getAllMedia
 * @method getAllMediaHard
 * @method getAllMediaById
 * @method getMediaNormal
 * @method getMediaNormalHard
 * @method getMediaNormalById
 */

exports.getStats = function () {
  let results
  try {
    results = storageConnector.getStats();
  } catch (err) {
    errorLogger.log(err);
    return {
      status: 500, 
      data: null
    };
  }

  return {
    status: 200, 
    data: results
  };
}

/**
 * Retrieves the list of buckets in the connected S3 from cache.
 *
 * @returns {{status: number, data: Array<Object>}} The Response to use in the REST Response.
 */
exports.getAllBuckets = function () {
  let result = {
    status: null,
    data: [],
  };

  try {
    const stmt = db.prepare("SELECT * FROM bucket");
    const rows = stmt.all();

    for (let row of rows) {
      result.data.push({
        bucketId: row.id,
        bucketName: row.name,
      });
      result.status = 200;
    }
  } catch (err) {
    errorLogger.log(err);
    result.status = 500;
  }

  return result;
};

/**
 * Retrieves the list of buckets in the connected S3.
 *
 * @async
 *
 * @returns {Promise<{status: number, data: Array<Object>}>} The Response to use in the REST Response.
 */
exports.getAllBucketsHard = async function () {
  let data;
  try {
    data = await storageConnector.getAllBuckets();

    if (data["$metadata"].httpStatusCode !== 200) {
      return {
        status: data["$metadata"].httpStatusCode,
        data: [],
      };
    }
  } catch (err) {
    errorLogger.log(err);
    return {
      status: 500,
      data: [],
    };
  }

  let result = {
    status: data["$metadata"].httpStatusCode,
    data: data.Buckets,
  };
  return result;
};

function getBucketSize(bucketId) {
  const stmt = db.prepare("SELECT COUNT(`id`) AS `total_count` FROM media WHERE bucket_id = @bucket_id");
  const row = stmt.get({ bucket_id: bucketId });

  if (row === undefined) {
    return 0;
  } else {
    return row.total_count;
  }
}

/**
 * Retrieves a list of media in the specified bucket from cache.
 *
 * @param {string} bucketName The specified bucket to retrieve media from.
 * @param {number} [page=1] The specified page to retrieve under pagination.
 * @param {number} [limit=10] The specified number of items in each page under pagination.
 *
 * @returns {{status: number, data: Array<Object>}} The Response to use in the REST Response.
 */
exports.getAllMedia = function (bucketName, page = 1, limit = 10) {
  let result = {
    status: null,
    data: { pages: 0, media: [] },
  };

  let bucketId;
  try {
    const stmt = db.prepare("SELECT * FROM bucket WHERE name = @name");
    const row = stmt.get({ name: bucketName });

    if (row === undefined) {
      result.status = 404;
    } else {
      bucketId = row.id;
    }
  } catch (err) {
    errorLogger.log(err);
    result.status = 500;
  }

  if (bucketId) {
    try {
      const stmt = db.prepare(
        "SELECT * FROM media WHERE bucket_id = @bucket_id LIMIT @limit OFFSET @offset"
      );
      const rows = stmt.all({
        bucket_id: bucketId,
        limit: limit,
        offset: (page - 1) * limit,
      });

      for (let row of rows) {
        result.data.media.push({
          mediaId: row.id,
          mediaName: row.name + row.extension,
        });
        result.status = 200;
        result.data.pages = getBucketSize(bucketId);
      }
    } catch (err) {
      errorLogger.log(err);
      result.status = 500;
    }
  }

  return result;
};

/**
 * Retrieves a list of media in the specified bucket.
 *
 * @async
 *
 * @param {string} bucketName The specified bucket to retrieve media from.
 * @param {number} [page=1] The specified page to retrieve under pagination.
 * @param {number} [limit=10] The specified number of items in each page under pagination.
 *
 * @returns {Promise<{status: number, data: {media: Array<Object>, pages: number | null}}>} The Response to use in the REST Response.
 */
exports.getAllMediaHard = async function (bucketName, page = 1, limit = 10) {
  let data;
  try {
    data = await storageConnector.getAllMedia(bucketName);

    if (data["$metadata"].httpStatusCode !== 200) {
      return {
        status: data["$metadata"].httpStatusCode,
        data: { pages: null, media: [] },
      };
    }
  } catch (err) {
    errorLogger.log(err);
    return {
      status: 500,
      data: { pages: null, media: [] },
    };
  }

  let result = {
    status: data["$metadata"].httpStatusCode,
    data: { media: data.Contents.slice((page - 1) * limit, (page - 1) * limit + limit), pages: Math.ceil(data.Contents.length / (limit * 1.0)) },
  };
  return result;
};

/**
 * Retrieves a list of media in the specified bucket from cache using bucket ID instead of names.
 *
 * @param {string} bucketId The specified bucket's ID in the cache to retrieve media from.
 * @param {number} [page=1] The specified page to retrieve under pagination.
 * @param {number} [limit=10] The specified number of items in each page under pagination.
 *
 * @returns {{status: number, data: Array<Object>}} The Response to use in the REST Response.
 */
exports.getAllMediaById = function (bucketId, page, limit) {
  let result = {
    status: null,
    data: { pages: 0, media: [] },
  };

  let isBucket = false;
  try {
    const stmt = db.prepare("SELECT * FROM bucket WHERE id = @id");
    const row = stmt.get({ id: bucketId });

    if (row === undefined) {
      result.status = 404;
    } else {
      isBucket = true;
    }
  } catch (err) {
    errorLogger.log(err);
    result.status = 500;
  }

  if (isBucket) {
    try {
      const stmt = db.prepare(
        "SELECT * FROM media WHERE bucket_id = @bucket_id LIMIT @limit OFFSET @offset"
      );
      const rows = stmt.all({
        bucket_id: bucketId,
        limit: limit,
        offset: (page - 1) * limit,
      });

      for (let row of rows) {
        result.data.media.push({
          mediaId: row.id,
          mediaName: row.name + row.extension,
        });
        result.status = 200;
        result.data.pages = getBucketSize(bucketId);
      }
    } catch (err) {
      errorLogger.log(err);
      result.status = 500;

      return result;
    }
  }

  return result;
};

/**
 * Retrieves the specified file from cache in the form of a ReadableStream for a RESTful Response.
 *
 * If the file is a video or audio file, byte-range chunks are retrieved instead of the whole file.
 *
 * @param {string} bucketName The specified bucket to retrieve media from.
 * @param {string} mediaName The specified media to retrieve.
 * @param {number} chunkSize The specified chunk size to retrieve for videos and audios.
 * @param {number} [start=0] The specified byte to start the byte-range from for videos and audios. Defaults to `0`.
 *
 * @returns {{status: number, stream: ReadableStream, headers: Object<string, *>}} The Response to use in the REST Response.
 */
exports.getMediaNormal = function (
  bucketName,
  mediaName,
  chunkSize,
  start = 0
) {
  let result = {
    status: null,
    stream: null,
    headers: null,
  };
  let mediaPath;
  let mediaSize;
  let bucketId;
  let mediaId;
  try {
    const stmt = db.prepare("SELECT * FROM bucket WHERE name = @name");
    const row = stmt.get({ name: bucketName });

    if (row === undefined) {
      result.status = 404;
    } else {
      bucketId = row.id;
      mediaPath = row.path;
      mediaPath = mediaPath.replace(/\//gi, "\\/\\");
    }
  } catch (err) {
    errorLogger.log(err);
    result.status = 500;
  }

  let mediaExtIdx = mediaName.lastIndexOf(".") + 1;
  let mediaExt;
  if (bucketId) {
    if (mediaExtIdx !== 0) {
      mediaExt = mediaName.slice(mediaExtIdx);
      mediaExt = mediaExt.toLowerCase();
    }
    if (mediaExt) {
      try {
        const stmt = db.prepare(
          "SELECT * FROM media WHERE bucket_id = @bucket_id AND name = @name AND extension = @extension"
        );
        const row = stmt.get({
          bucket_id: bucketId,
          name: mediaName.slice(0, mediaExtIdx - 1),
          extension: mediaExt,
        });

        if (row === undefined) {
          result.status = 404;
        } else {
          mediaId = row.id;
          mediaPath += row.path.replace(/\//gi, "\\/\\");
          mediaSize = row.size;
        }
      } catch (err) {
        errorLogger.log(err);
        result.status = 500;
      }
    } else {
      errorLogger.log("The requested media's MIME type is not specified. ");
      result.status = 400;

      return result;
    }
  }

  if (mediaId) {
    if (imageMap.get(mediaExt) !== undefined) {
      try {
        const stmt = db.prepare(
          "SELECT * FROM local_store WHERE media_id = @media_id"
        );
        const row = stmt.get({ media_id: mediaId });

        if (row === undefined) {
          result.status = 404;
        } else {
          let dataStream = fs.createReadStream(
            `server/media/${mediaPath}.${mediaExt}`
          );
          result.stream = dataStream;

          result.headers = {
            "Content-Type": imageMap.get(mediaExt),
          };

          result.status = 200;

          const stmt = db.prepare("UPDATE media SET count = count + 1 WHERE id = @id");
          stmt.run({ id: mediaId });
        }
      } catch (err) {
        errorLogger.log(err);
        result.status = 500;
      }
    } else {
      if (mediaSize === null) {
        mediaSize = storageConnector.getMediaSize(bucketName, mediaName);
        if (mediaSize === null) {
          errorLogger.log("Media not present in storage. ");
          result.status = 404;

          return result;
        }
      }
      let end = Math.min(start + chunkSize, mediaSize - 1);
      try {
        const stmt = db.prepare(
          "SELECT * FROM local_store WHERE media_id = @media_id AND (chunk_size = @media_size OR chunk_size > @end)"
        );
        const row = stmt.get({
          media_id: mediaId,
          media_size: mediaSize,
          end: end,
        });

        if (row === undefined) {
          result.status = 404;
        } else {
          let contentType;
          if (videoMap.get(mediaExt) !== undefined) {
            contentType = videoMap.get(mediaExt);
          } else if (audioMap.get(mediaExt) !== undefined) {
            contentType = audioMap.get(mediaExt);
          } else {
            result.status = 500;
            return;
          }
          let contentLength = end - start + 1;
          let dataStream = fs.createReadStream(
            `server/media/${mediaPath}.${mediaExt}`,
            { start, end }
          );
          result.stream = dataStream;
          result.headers = {
            "Content-Range": `bytes ${start}-${end}/${mediaSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": contentType,
          };

          result.status = 206;

          if (start === 0) {
            const stmt = db.prepare("UPDATE media SET count = count + 1 WHERE id = @id");
            stmt.run({ id: mediaId });
          }
        }
      } catch (err) {
        errorLogger.log(err);
        result.status = 500;
      }
    }
  }

  return result;
};

/**
 * Retrieves the specified file in the form of a ReadableStream for a RESTful Response.
 *
 * If the file is a video or audio file, byte-range chunks are retrieved instead of the whole file.
 *
 * @async
 *
 * @param {string} bucketName The specified bucket to retrieve media from.
 * @param {string} mediaName The specified media to retrieve.
 * @param {number} chunkSize The specified chunk size to retrieve for videos and audios.
 * @param {number} [start=0] The specified byte to start the byte-range from for videos and audios. Defaults to `0`.
 *
 * @returns {Promise<{status: number, stream: ReadableStream, headers: Object<string, *>}>} The Response to use in the REST Response.
 */
exports.getMediaNormalHard = async function (
  bucketName,
  mediaName,
  chunkSize,
  start = 0
) {
  // let mediaSize = fs.statSync("server/media/Test_Recording.mp4").size;
  // let end_ = Math.min(start + chunkSize, mediaSize - 1);
  // let data = {
  //     "$metadata": {
  //         httpStatusCode: 200
  //     },
  //     Body: fs.createReadStream("server/media/Test_Recording.mp4", { start, end_ })
  // }

  // Get the media file's extension
  let mediaExtIdx = mediaName.lastIndexOf(".") + 1;
  let mediaExt;
  if (mediaExtIdx !== 0) {
    mediaExt = mediaName.slice(mediaExtIdx);
    mediaExt = mediaExt.toLowerCase();
  }

  // Tailor response based on media type inferred from media file's extension
  if (mediaExt === undefined) {
    // No extension present in provided name
    return {
      status: 400,
      stream: null,
      headers: null,
    };
  } else if (imageMap.get(mediaExt) !== undefined) {
    // Image file

    // Get file from storage
    let data;
    try {
      data = await storageConnector.getMediaNormal(
        bucketName,
        mediaName,
        start
      );

      if (
        data["$metadata"].httpStatusCode !== 200 &&
        data["$metadata"].httpStatusCode !== 206
      ) {
        return {
          status: data["$metadata"].httpStatusCode,
          stream: null,
          headers: null,
        };
      }
    } catch (err) {
      errorLogger.log(err);
      return {
        status: 500,
        stream: null,
        headers: null,
      };
    }

    let result = {
      status: data["$metadata"].httpStatusCode,
      stream: data.Body,
      headers: {
        "Content-Type": imageMap.get(mediaExt),
      },
    };
    return result;
  } else {
    // All other media type (video OR audio)

    // Determine media file size
    let mediaSize;
    try {
      mediaSize = await storageConnector.getMediaSize(bucketName, mediaName);
      if (mediaSize === null) {
        errorLogger.log("Media not found. ");
        return {
          status: 404,
          stream: null,
          headers: null,
        };
      }
    } catch (err) {
      errorLogger.log(err);
      return {
        status: 500,
        stream: null,
        headers: null,
      };
    }

    // Determine end byte of file chunking byte-range
    let end = Math.min(start + chunkSize, mediaSize - 1);

    // Retrieve file chunk
    let data;
    try {
      data = await storageConnector.getMediaNormal(
        bucketName,
        mediaName,
        start,
        end
      );

      if (
        data["$metadata"].httpStatusCode !== 200 &&
        data["$metadata"].httpStatusCode !== 206
      ) {
        return {
          status: data["$metadata"].httpStatusCode,
          stream: null,
          headers: null,
        };
      }
    } catch (err) {
      errorLogger.log(err);
      return {
        status: 500,
        stream: null,
        headers: null,
      };
    }

    // Tailor response depending on whether the file is video or audio
    if (videoMap.get(mediaExt) !== undefined) {
      // Video file
      let contentLength = end - start + 1;
      let contentType = videoMap.get(mediaExt);

      let result = {
        status: data["$metadata"].httpStatusCode,
        stream: data.Body,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${mediaSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": contentLength,
          "Content-Type": contentType,
        },
      };
      return result;
    } else if (audioMap.get(mediaExt) !== undefined) {
      // Audio file
      let contentLength = end - start + 1;
      let contentType = audioMap.get(mediaExt);

      let result = {
        status: data["$metadata"].httpStatusCode,
        stream: data.Body,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${mediaSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": contentLength,
          "Content-Type": contentType,
        },
      };
      return result;
    } else {
      return {
        status: 500,
        stream: null,
        headers: null,
      };
    }
  }
};

/**
 * Retrieves the specified file from cache in the form of a ReadableStream for a RESTful Response, using the cached IDs of bucket and media.
 *
 * If the file is a video or audio file, byte-range chunks are retrieved instead of the whole file.
 *
 * @param {number} bucketId The ID of the specified bucket to retrieve media from.
 * @param {number} mediaId The ID of the specified media to retrieve.
 * @param {number} chunkSize The specified chunk size to retrieve for videos and audios.
 * @param {number} [start=0] The specified byte to start the byte-range from for videos and audios. Defaults to `0`.
 *
 * @returns {{status: number, stream: ReadableStream, headers: Object<string, *>}} The Response to use in the REST Response.
 */
exports.getMediaNormalById = function (bucketId, mediaId, chunkSize, start) {
  let result = {
    status: null,
    stream: null,
    headers: null,
  };
  let mediaPath;
  let mediaSize;
  let bucketName;
  let mediaName;
  try {
    const stmt = db.prepare("SELECT * FROM bucket WHERE id = @id");
    const row = stmt.get({ id: bucketId });

    if (row === undefined) {
      result.status = 404;
    } else {
      bucketName = row.name;
      mediaPath = row.path;
      mediaPath = mediaPath.replace(/\//gi, "\\/\\");
    }
  } catch (err) {
    errorLogger.log(err);
    result.status = 500;
  }

  let mediaExt;
  if (bucketName) {
    try {
      const stmt = db.prepare(
        "SELECT * FROM media WHERE bucket_id = @bucket_id AND id = @id"
      );
      const row = stmt.get({ bucket_id: bucketId, id: mediaId });

      if (row === undefined) {
        result.status = 404;
      } else {
        mediaName = row.name;
        mediaPath += row.path.replace(/\//gi, "\\/\\");
        mediaSize = row.size;
        mediaExt = row.extension;
      }
    } catch (err) {
      errorLogger.log(err);
      result.status = 500;
    }
  }

  if (mediaName) {
    if (imageMap.get(mediaExt) !== undefined) {
      try {
        const stmt = db.prepare(
          "SELECT * FROM local_store WHERE media_id = @media_id"
        );
        const row = stmt.get({ media_id: mediaId });

        if (row === undefined) {
          result.status = 404;
        } else {
          let dataStream = fs.createReadStream(
            `server/media/${mediaPath}.${mediaExt}`
          );
          result.stream = dataStream;

          result.headers = {
            "Content-Type": imageMap.get(mediaExt),
          };

          result.status = 200;

          const stmt = db.prepare("UPDATE media SET count = count + 1 WHERE id = @id");
          stmt.run({ id: mediaId });
        }
      } catch (err) {
        errorLogger.log(err);
        result.status = 500;
      }
    } else {
      if (mediaSize === null) {
        mediaSize = storageConnector.getMediaSize(bucketName, mediaName);
        if (mediaSize === null) {
          errorLogger.log("Media not present in storage. ");
          result.status = 404;

          return result;
        }
      }
      let end = Math.min(start + chunkSize, mediaSize - 1);
      try {
        const stmt = db.prepare(
          "SELECT * FROM local_store WHERE media_id = @media_id AND (chunk_size = @media_size OR chunk_size > @end)"
        );
        const row = stmt.get({
          media_id: mediaId,
          media_size: mediaSize,
          end: end,
        });

        if (row === undefined) {
          result.status = 404;
        } else {
          let contentType;
          if (videoMap.get(mediaExt) !== undefined) {
            contentType = videoMap.get(mediaExt);
          } else if (audioMap.get(mediaExt) !== undefined) {
            contentType = audioMap.get(mediaExt);
          } else {
            result.status = 500;
            return;
          }
          let contentLength = end - start + 1;
          let dataStream = fs.createReadStream(
            `server/media/${mediaPath}.${mediaExt}`,
            { start, end }
          );
          result.stream = dataStream;
          result.headers = {
            "Content-Range": `bytes ${start}-${end}/${mediaSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": contentType,
          };

          result.status = 206;

          if (start === 0) {
            const stmt = db.prepare("UPDATE media SET count = count + 1 WHERE id = @id");
            stmt.run({ id: mediaId });
          }
        }
      } catch (err) {
        errorLogger.log(err);
        result.status = 500;
      }
    }
  }

  return result;
};
