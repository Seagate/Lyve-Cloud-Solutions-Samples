const mediaManager = require("../modules/mediaManager");
const { imageMap } = require("../modules/MIMEMap");

/**
 * @module streamingController
 *
 * @method listBuckets
 * @method listBucketsHard
 * @method listMedia
 * @method listMediaHard
 * @method listMediaById
 * @method getMediaNormal
 * @method getMediaNormalHard
 * @method getMediaNormalById
 */

exports.getStats = function (req, res, next) {
  let stats = mediaManager.getStats(); 

  if (stats.status === 500) {
    let results = {
      code: 500,
      message: "An error occurred while retrieving the storage stats. ",
    };
    res.status(500); // Internal Server Error
    res.json(results);
    res.end();
    return;
  }

  // Successfully retrieved stats
  let results = {
    code: 200,
    message: "Stats retrieved successfully. ",
    data: stats.data,
  };
  res.status(200); // OK
  res.json(results);
  res.end();
  return;
}

exports.listBuckets = async function (req, res, next) {
  // Retrieve buckets from cache
  let allBuckets = mediaManager.getAllBuckets();

  // Failed to retrieve from cache
  if (allBuckets.status === 500) {
    // Retrieve buckets from Cloud S3
    allBuckets = await mediaManager.getAllBucketsHard();

    // Failed to retrieve from Cloud S3
    if (allBuckets.status === 500) {
      let results = {
        code: 500,
        message: "An error occurred while retrieving the data from storage. ",
      };
      res.status(500); // Internal Server Error
      res.json(results);
      res.end();
      return;
    }

    // Successfully retrieved from Cloud S3 and sends data
    let results = {
      code: 200,
      message: "Buckets retrieved successfully. ",
      data: allBuckets.data,
    };
    res.status(200); // OK
    res.json(results);
    res.end();
    return;
  }

  // Successfully retrieved from cache and sends data
  let results = {
    code: 200,
    message: "Buckets retrieved from cache successfully. ",
    data: allBuckets.data,
  };
  res.status(200); // OK
  res.json(results);
  res.end();
  return;
};

exports.listBucketsHard = async function (req, res, next) {
  // Retrieve buckets from Cloud S3
  let allBuckets = await mediaManager.getAllBucketsHard();

  // Failed to retrieve from Cloud S3
  if (allBuckets.status === 500) {
    let results = {
      code: 500,
      message: "An error occurred while retrieving the data from storage. ",
    };
    res.status(500); // Internal Server Error
    res.json(results);
    res.end();
    return;
  }

  // Successfully retrieved from Cloud S3 and sends data
  let results = {
    code: 200,
    message: "Buckets retrieved successfully. ",
    data: allBuckets.data,
  };
  res.status(200); // OK
  res.json(results);
  res.end();
  return;
};

exports.listMedia = async function (req, res, next) {
  // Retrieve neccessary request parameter(s)
  let bucketName;
  let page;
  let limit;
  try {
    bucketName = req.params.bucketName;
    page = req.query.page;
    limit = req.query.limit;

    // Check neccessary request parameter(s)
    if (typeof bucketName !== "string") {
      bucketName = String(bucketName);
    }

    if (typeof page !== "number") {
      page = parseInt(page, 10);
    }

    if (typeof limit !== "number") {
      limit = parseInt(limit, 10);
    }
  } catch (err) {
    // Bad request parameters
    let results = {
      code: 400,
      message:
        "The request parameters `bucketName`, `page` and `limit` are not present or properly formatted. ",
    };
    res.status(400); // Bad Request
    res.json(results);
    res.end();
    return;
  }

  // Retrieve media details from cache
  let allMedia = mediaManager.getAllMedia(bucketName, page, limit);

  // Failed to retrieve from cache
  if (allMedia.status === 500 || allMedia.status === 404) {
    // Retrieve media details from Cloud S3
    allMedia = await mediaManager.getAllMediaHard(bucketName, page, limit);

    // Failed to retrieve from Cloud S3
    if (allMedia.status === 500) {
      let results = {
        code: 500,
        message: "An error occurred while retrieving the data from storage. ",
      };
      res.status(500); // Internal Server Error
      res.json(results);
      res.end();
      return;
    } else if (allMedia.status === 404) {
      let results = {
        code: 404,
        data: {
          bucketName: bucketName,
        },
        message: "Data specified does not exist. ",
      };
      res.status(404); // Not Found
      res.json(results);
      res.end();
      return;
    }

    // Successfully retrieved from Cloud S3
    let results = {
      code: 200,
      message: "Media retrieved from bucket successfully. ",
      data: allMedia.data,
    };
    res.status(200); // 200 OK
    res.json(results);
    res.end();
    return;
  }

  // Successfully retrieve from cache
  let results = {
    code: 200,
    message: "Media retrieved from bucket cache successfully. ",
    data: allMedia.data,
  };
  res.status(200); // 200 OK
  res.json(results);
  res.end();
  return;
};

exports.listMediaHard = async function (req, res, next) {
  // Retrieve neccessary request parameter(s)
  let bucketName;
  let page;
  let limit;
  try {
    bucketName = req.params.bucketName;
    page = req.query.page;
    limit = req.query.limit;

    // Check neccessary request parameter(s)
    if (typeof bucketName !== "string") {
      bucketName = String(bucketName);
    }

    if (typeof page !== "number") {
      page = parseInt(page, 10);
    }

    if (typeof limit !== "number") {
      limit = parseInt(limit, 10);
    }
  } catch (err) {
    // Bad request parameter(s)
    let results = {
      code: 400,
      message:
        "The request parameters `bucketName`, `page` and `limit` are not present or properly formatted. ",
    };
    res.status(400); // Bad Request
    res.json(results);
    res.end();
    return;
  }

  // Retrieve media details from Cloud S3
  let allMedia = await mediaManager.getAllMediaHard(bucketName, page, limit);

  // Failed to retrieve from Cloud S3
  if (allMedia.status === 500) {
    let results = {
      code: 500,
      message: "An error occurred while retrieving the data from storage. ",
    };
    res.status(500); // Internal Server Error
    res.json(results);
    res.end();
    return;
  } else if (allMedia.status === 404) {
    let results = {
      code: 404,
      data: {
        bucketName: bucketName,
      },
      message: "Data specified does not exist. ",
    };
    res.status(404); // Not Found
    res.json(results);
    res.end();
    return;
  }

  // Successfully retrieved from Cloud S3
  let results = {
    code: 200,
    message: "Media retrieved from bucket successfully. ",
    data: allMedia.data,
  };
  res.status(200); // 200 OK
  res.json(results);
  res.end();
  return;
};

exports.listMediaById = function (req, res, next) {
  // Retrieve neccessary request parameter(s)
  let bucketId;
  let page;
  let limit;
  try {
    bucketId = req.params.bucketId;
    page = req.query.page;
    limit = req.query.limit;

    // Check neccessary request parameter(s)
    if (typeof bucketId !== "number") {
      bucketId = parseInt(bucketId, 10);
    }

    if (typeof page !== "number") {
      page = parseInt(page, 10);
    }

    if (typeof limit !== "number") {
      limit = parseInt(limit, 10);
    }
  } catch (err) {
    // Bad request parameter(s)
    let results = {
      code: 400,
      message:
        "The request parameters `bucketId`, `page` and `limit` are not present or properly formatted. ",
    };
    res.status(400); // Bad Request
    res.json(results);
    res.end();
    return;
  }

  // Retrieve media details from cache
  let allMedia = mediaManager.getAllMediaById(bucketId, page, limit);

  // Failed to retrieve from cache
  if (allMedia.status === 500) {
    let results = {
      code: 500,
      message: "An error occurred while retrieving the data from cache. ",
    };
    res.status(500); // Internal Server Error
    res.json(results);
    res.end();
    return;
  } else if (allMedia.status === 404) {
    let results = {
      code: 404,
      data: {
        bucketId: bucketId,
      },
      message: "Data specified does not exist in cache. ",
    };
    res.status(404); // Not Found
    res.json(results);
    res.end();
    return;
  }

  // Successfully retrieved from cache
  let results = {
    code: 200,
    message: "Media retrieved from bucket cache successfully. ",
    data: allMedia.data,
  };
  res.status(200); // 200 OK
  res.json(results);
  res.end();
  return;
};

/**
 * A function that helps with removing or extracting the extension from a filename.
 *
 * @param {string} filename The name of the file whose extension is to be removed.
 * @param {boolean} returnExt Whether to return the extension or the name of the file without the extension.
 *
 * @returns {string} The requested part of the filename.
 */
function removeExt(filename, returnExt = true) {
  let extIdx = filename.lastIndexOf(".");
  if (returnExt) {
    return filename.slice(extIdx + 1);
  } else {
    return filename.slice(0, extIdx);
  }
}

exports.getMediaNormal = async function (req, res, next) {
  // Retrieve neccessary request parameter(s)
  let bucketName;
  let mediaName;
  try {
    bucketName = req.params.bucketName;
    mediaName = req.params.mediaName;

    // Check neccessary request parameter(s)
    if (typeof bucketName !== "string") {
      bucketName = String(bucketName);
    }

    if (typeof mediaName !== "string") {
      mediaName = String(mediaName);
    }
  } catch (err) {
    let results = {
      code: 400,
      message:
        "The request parameters `bucketName` and `mediaName` are not present or properly formatted. ",
    };
    res.status(400); // Bad Request
    res.json(results);
    res.end();
    return;
  }

  let ext = removeExt(mediaName);
  let range;
  if (imageMap.get(ext) === undefined) {
    // Ensure `Range` header present
    range = req.get("Range");
    if (!range) {
      res.status(400).json({
        code: 400,
        message: "`Range` header not present. ",
      });
      res.end();
      return;
    }
  } else {
    range = "0";
  }

  // Parse `Range` header, e.g.: "bytes=32324-"
  const chunkSize = 1 * 10 ** 6; // 1MB default
  const start = Number(range.replace(/\D/g, ""));

  // Retrieve media data from cache
  let mediaData = mediaManager.getMediaNormal(
    bucketName,
    mediaName,
    chunkSize,
    start
  );

  // Failed to retrieve from cache
  if (mediaData.status === 500 || mediaData.status === 404) {
    // Retrieve media data from Cloud S3
    mediaData = await mediaManager.getMediaNormalHard(
      bucketName,
      mediaName,
      chunkSize,
      start
    );

    // Failed to retrieve from Cloud S3
    if (mediaData.status === 500) {
      let results = {
        code: 500,
        message: "An error occurred while retrieving the data from storage. ",
      };
      res.status(500); // Internal Server Error
      res.json(results);
      res.end();
      return;
    } else if (mediaData.status === 404) {
      let results = {
        code: 404,
        data: {
          bucketName: bucketName,
          mediaName: mediaName,
        },
        message: "Data specified does not exist. ",
      };
      res.status(404); // Not Found
      res.json(results);
      res.end();
      return;
    } else if (mediaData.status === 400) {
      let results = {
        code: 400,
        data: {
          bucketName: bucketName,
          mediaName: mediaName,
        },
        message:
          "The request parameters `bucketName` and `mediaName` are not present or properly formatted. ",
      };
      res.status(400); // Bad Request
      res.json(results);
      res.end();
      return;
    }

    // HTTP Status 206 for Partial Content
    res.set(mediaData.headers);
    res.status(206); // Partial Content

    mediaData.stream.pipe(res);
  } else if (mediaData.status === 400) {
    let results = {
      code: 400,
      data: {
        bucketName: bucketName,
        mediaName: mediaName,
      },
      message:
        "The request parameters `bucketName` and `mediaName` are not present or properly formatted. ",
    };
    res.status(400); // Bad Request
    res.json(results);
    res.end();
    return;
  } else {
    // HTTP Status 206 for Partial Content
    res.set(mediaData.headers);
    res.status(206); // Partial Content

    mediaData.stream.pipe(res);
  }
};

exports.getMediaNormalHard = async function (req, res, next) {
  // Retrieve neccessary request parameter(s)
  let bucketName;
  let mediaName;
  try {
    bucketName = req.params.bucketName;
    mediaName = req.params.mediaName;

    // Check neccessary request parameter(s)
    if (typeof bucketName !== "string") {
      bucketName = String(bucketName);
    }

    if (typeof mediaName !== "string") {
      mediaName = String(mediaName);
    }
  } catch (err) {
    // Bad request parameter(s)
    let results = {
      code: 400,
      message:
        "The request parameters `bucketName` and `mediaName` are not present or properly formatted. ",
    };
    res.status(400); // Bad Request
    res.json(results);
    res.end();
    return;
  }

  let ext = removeExt(mediaName);
  let range;
  if (imageMap.get(ext) === undefined) {
    // Ensure `Range` header present
    range = req.get("Range");
    if (!range) {
      res.status(400).json({
        code: 400,
        message: "`Range` header not present. ",
      });
      res.end();
      return;
    }
  } else {
    range = "0";
  }

  // Parse `Range` headers, e.g.: "bytes=32324-"
  const chunkSize = 1 * 10 ** 6; // 1MB default
  const start = Number(range.replace(/\D/g, ""));

  // Retrieve media data from Cloud S3
  let mediaData = await mediaManager.getMediaNormalHard(
    bucketName,
    mediaName,
    chunkSize,
    start
  );

  // Failed to retrieve from Cloud S3
  if (mediaData.status === 500) {
    let results = {
      code: 500,
      message: "An error occurred while retrieving the data from storage. ",
    };
    res.status(500); // Internal Server Error
    res.json(results);
    res.end();
    return;
  } else if (mediaData.status === 404) {
    let results = {
      code: 404,
      data: {
        bucketName: bucketName,
        mediaName: mediaName,
      },
      message: "Data specified does not exist. ",
    };
    res.status(404); // Not Found
    res.json(results);
    res.end();
    return;
  } else if (mediaData.status === 400) {
    let results = {
      code: 400,
      data: {
        bucketName: bucketName,
        mediaName: mediaName,
      },
      message:
        "The request parameters `bucketName` and `mediaName` are not present or properly formatted. ",
    };
    res.status(400); // Bad Request
    res.json(results);
    res.end();
    return;
  }

  // HTTP Status 206 for Partial Content
  res.set(mediaData.headers);
  res.status(206); // Partial Content

  mediaData.stream.pipe(res);
};

exports.getMediaNormalById = function (req, res, next) {
  // Ensure `Range` header present
  const range = req.get("Range");
  if (!range) {
    res.status(400).json({
      code: 400,
      message: "`Range` header not present. ",
    });
    res.end();
    return;
  }

  // Retrieve neccessary request parameter(s)
  let bucketId;
  let mediaId;
  try {
    bucketId = req.params.bucketId;
    mediaId = req.params.mediaId;

    // Check neccessary request parameter(s)
    if (typeof bucketId !== "number") {
      bucketId = parseInt(bucketId, 10);
    }

    if (typeof mediaId !== "number") {
      mediaId = parseInt(mediaId, 10);
    }
  } catch (err) {
    // Bad request parameter(s)
    let results = {
      code: 400,
      message:
        "The request parameters `bucketId` and `mediaId` are not present or properly formatted. ",
    };
    res.status(400); // Bad Request
    res.json(results);
    res.end();
    return;
  }

  // Parse `Range` header, e.g.: "bytes=32324-"
  const chunkSize = 1 * 10 ** 6; // 1MB default
  const start = Number(range.replace(/\D/g, ""));

  // Retrieve media data from cache
  let mediaData = mediaManager.getMediaNormalById(
    bucketId,
    mediaId,
    chunkSize,
    start
  );

  // Failed to retrieve from cache
  if (mediaData.status === 500) {
    let results = {
      code: 500,
      message: "An error occurred while retrieving the data from cache. ",
    };
    res.status(500); // Internal Server Error
    res.json(results);
    res.end();
    return;
  } else if (mediaData.status === 404) {
    let results = {
      code: 404,
      data: {
        bucketId: bucketId,
        mediaId: mediaId,
      },
      message: "Data specified does not exist in cache. ",
    };
    res.status(404); // Not Found
    res.json(results);
    res.end();
    return;
  } else if (mediaData.status === 400) {
    let results = {
      code: 400,
      data: {
        bucketName: bucketName,
        mediaName: mediaName,
      },
      message:
        "The request parameters `bucketName` and `mediaName` are not present or properly formatted. ",
    };
    res.status(400); // Bad Request
    res.json(results);
    res.end();
    return;
  }

  // HTTP Status 206 for Partial Content
  res.set(mediaData.headers);
  res.status(206); // Partial Content

  mediaData.stream.pipe(res);
};

exports.getMediaHLS = function (req, res, next) {
  let mediaId = req.params["mediaId"];

  let mediaData = mediaManager.getMedia(mediaId);

  // TODO

  return mediaData;
};
