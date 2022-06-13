const { exit } = require("process");
const fs = require("fs");
const Database = require("better-sqlite3");
const storageConnector = require("./storageConnector");
const { imageMap } = require("./MIMEMap");
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

// All operations of the worker that updates the local cache and DB at set intervals below
/**
 * @module updateStore
 *
 * @method update
 */

/**
 * Request details of all buckets from Cloud S3.
 *
 * @throws {Error} Error occurred in retrieving data from Cloud S3.
 *
 * @returns {Array<{ Name: string }>} Array of bucket details requested.
 */
async function retrieveBuckets() {
  try {
    // Retrieve all buckets from Cloud S3
    let data = await storageConnector.getAllBuckets();

    // Error in retrieval
    if (data["$metadata"].httpStatusCode !== 200) {
      errorLogger.log("Error in retrieveBuckets");
      throw new Error("Error in retrieveBuckets");
    } else {
      return data.Buckets;
    }
  } catch (err) {
    errorLogger.log(err);
    throw err;
  }
}

/**
 * Updates (deletes and inserts) the current cache's record of the buckets - Sync with Cloud S3.
 *
 * @param {Array<{ Name: string }>} buckets Array of objects representing buckets retrieved from Cloud S3.
 *
 * @throws {Error} An error from interfacing with the Cloud S3 or local cache.
 *
 * @returns {boolean} The success status of the update.
 */
function updateBuckets(buckets) {
  let dbErr;
  let currentBuckets = new Map();
  // Get currently tracked buckets
  try {
    const stmt = db.prepare("SELECT * FROM bucket");
    const rows = stmt.all();

    for (let row of rows) {
      currentBuckets.set(row.name, {
        name: row.name,
        path: row.path,
      });
    }
  } catch (err) {
    errorLogger.log(err);
    throw err;
  }

  // Compare and record which buckets to create or delete in local storage
  let toDelete = [];
  let toCreate = [];
  for (let bucket of buckets) {
    if (currentBuckets.has(bucket.Name)) {
      currentBuckets.delete(bucket.Name);
    } else {
      toCreate.push({
        name: bucket.Name,
        path: bucket.Name,
      });
    }
  }
  for (let key of currentBuckets.keys()) {
    toDelete.push(currentBuckets.get(key));
  }

  // Delete buckets
  for (let bucket of toDelete) {
    try {
      const stmt = db.prepare("DELETE FROM bucket WHERE name = @name AND path = @path");
      stmt.run({ name: bucket.name, path: bucket.path });
    } catch (err) {
      errorLogger.log(err);
      throw err;
    }
    fs.rm(
      `server/media/${bucket.path.replace(/\//g, "\\/\\")}`,
      { recursive: true },
      (err) => {
        errorLogger.log(err);
        dbErr = err;
      }
    );
    if (dbErr) {
      throw dbErr;
    }
  }
  // Create buckets
  for (let bucket of toCreate) {
    try {
      const stmt = db.prepare("INSERT INTO bucket (name, path) VALUES (@name, @path)");
      stmt.run({ name: bucket.name, path: bucket.path });
    } catch (err) {
      errorLogger.log(err);
      throw err;
    }
    fs.mkdir(
      `server/media/${bucket.path.replace(/\//g, "\\/\\")}`,
      { recursive: true },
      (err) => {
        errorLogger.log(err);
        dbErr = err;
      }
    );
    if (dbErr) {
      throw dbErr;
    }
  }

  return true;
}

/**
 * Retrieve details of the media under the specified bucket from Cloud S3.
 *
 * @param {string} bucket The name of the bucket to retrieve media details from.
 *
 * @throws {Error} An error if there was a failure in retrieving media details from S3.
 *
 * @returns {Array<{ Key: string, Size: number }>} An array containing details of the media in the specified bucket.
 */
async function retrieveMedia(bucket) {
  try {
    // Retrieve all media details under specified bucket from Cloud S3
    let data = await storageConnector.getAllMedia(bucket);

    // Error in retrieval
    if (data["$metadata"].httpStatusCode !== 200) {
      errorLogger.log("Error in retrieveMedia");
      throw new Error("Error in retrieveMedia");
    } else {
      return data.Contents;
    }
  } catch (err) {
    errorLogger.log(err);
    throw err;
  }
}

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

/**
 * Updates (deletes and inserts) the current cache's record of the media - Sync with Cloud S3.
 *
 * @param {string} bucket Name of the bucket whose media detail is to be retrieved from Cloud S3.
 * @param {Array<{ Key: string, Size: number }>} media Array of objects representing media details retrieved from Cloud S3.
 *
 * @throws {Error} An error from interfacing with the Cloud S3 or local cache.
 *
 * @returns {boolean} The success status of the update.
 */
function updateMedia(bucket, media) {
  let dbErr; // Error flag
  let bucketId;
  let bucketPath;
  // Get target bucket's ID and path
  try {
    const stmt = db.prepare("SELECT id FROM bucket WHERE name = @name");
    const row = stmt.get({ name: bucket });

    if (row === undefined) {
      let err = new Error(
        "The bucket specified does not exist in local cache. "
      );
      errorLogger.log(err);
      throw err;
    } else {
      bucketId = row.id;
      bucketPath = row.path;
    }
  } catch (err) {
    errorLogger.log(err);
    throw err;
  }
  let currentMedia = new Map();
  // Get currently tracked media
  try {
    const stmt = db.prepare("SELECT * FROM media WHERE bucket_id = @bucket_id");
    const rows = stmt.all({ bucket_id: bucketId });

    for (let row of rows) {
      currentMedia.set(row.name, {
        name: row.name,
        path: row.path,
        extension: row.extension,
        size: row.size,
      });
    }
  } catch (err) {
    errorLogger.log(err);
    throw err;
  }

  // Compare and record which media is present under the specified bucket
  let toDelete = [];
  let toCreate = [];
  for (let medium of media) {
    if (currentMedia.has(medium.Key)) {
      currentMedia.delete(medium.Key);
    } else {
      toCreate.push({
        name: medium.Key,
        path: removeExt(medium.Key, (returnExt = false)),
        extension: removeExt(medium.Key),
        size: medium.Size,
      });
    }
  }
  for (let key of currentMedia.keys()) {
    toDelete.push(currentMedia.get(key));
  }

  // Delete media
  for (let medium of toDelete) {
    try {
      const stmt = db.prepare("DELETE FROM media WHERE name = @name AND path = @path AND extension = @extension AND size = @size AND bucket_id = @bucket_id");
      stmt.run({
        name: medium.name,
        path: medium.path,
        extension: medium.extension,
        size: medium.size,
        bucket_id: bucketId,
      });
    } catch (err) {
      errorLogger.log(err);
      throw err;
    }
    fs.rm(
      `server/media/${bucketPath.replace(/\//g, "\\/\\")}/${medium.name}`,
      { force: true, recursive: true },
      (err) => {
        errorLogger.log(err);
        dbErr = err;
      }
    );
    if (dbErr) {
      throw dbErr;
    }
  }
  // Create media
  for (let medium of toCreate) {
    try {
      const stmt = db.prepare("INSERT INTO media (name, path, extension, size, count, bucket_id) VALUES (@name, @path, @extension, @size, 0, @bucket_id)");
      stmt.run({
        name: medium.name,
        path: medium.path,
        extension: medium.extension,
        size: medium.size,
        bucket_id: bucketId,
      });
    } catch (err) {
      errorLogger.log(err);
      throw err;
    }
  }

  return true;
}

/**
 * Calculates the popularity score of each media and returns an array containing media shortlisted for caching,
 * along with their details and scores.
 *
 * @returns {Array<{ id: number, name: string, path: string, extension: string, size: number, bucket_id: number, score: number }>}
 */
function computeMediaScores() {
  let dbErr;
  let totalCount;
  // Get the total number of views so far
  try {
    const stmt = db.prepare("SELECT SUM(`count`) as `total_count` FROM media");
    const row = stmt.get();

    totalCount = row.total_count;
  } catch (err) {
    errorLogger.log(err);
    throw err;
  }
  // Get the available media's details and their scores
  const mediaScores = [];
  try {
    const stmt = db.prepare("SELECT id, name, path, extension, size, bucket_id, (count / CAST(@total_count as REAL)) AS score FROM media ORDER BY score DESC"); // NOTE
    const rows = stmt.all({ total_count: totalCount });

    for (let row of rows) {
      mediaScores.push({
        id: row.id,
        name: row.name,
        path: row.path,
        extension: row.extension,
        size: row.size,
        bucket_id: row.bucket_id,
        score: row.score,
      });
    }
  } catch (err) {
    errorLogger.log(err);
    throw err;
  }
  // Filter for the media covering 80% of consumer usage
  let total = 0;
  let results;
  for (let i = 0; i < mediaScores.length; i++) {
    total += mediaScores[0].score;
    if (total > 0.8) {
      results = mediaScores.slice(0, Math.min(i + 1, mediaScores.length));
      break;
    }
  }
  // Returns list of media to store in local cache
  if (results) {
    return results;
  } else {
    return mediaScores;
  }
}

/**
 * Decides the percentage of a fully popular file to cache.
 *
 * @param {number} z The size of the file to cache.
 *
 * @returns {number} The percentage of the file to cache at full popularity.
 */
function adjustedSigmoid(z, scaleFactor) {
  z = ((z - scaleFactor) * 6) / scaleFactor; // Rescale the domain to [0, 2*scaleFactor]
  return Math.exp(z) / (Math.exp(z) + 1);
}

/**
 * Returns the appropriate percentage to cache a file with according to its popularity and file size.
 *
 * @param {number} size The size of the file to cache.
 * @param {number} score The score allocated to the media file according to consumer consumption rates.
 *
 * @returns {number} The percentage of the file to cache locally.
 */
function scoringAlgo(size, score) {
  const scaleFactor = process.env.CACHE_SCALE_FACTOR || 500000000; // Scale factor such that around 50% of a size 5*E8 file is cached at full popularity
  if (size < 0) {
    size = 0;
  } else if (size > 2 * scaleFactor) {
    size = 2 * scaleFactor;
  }
  return score * adjustedSigmoid(size, scaleFactor); // `score` indicates popularity;
}

function getBucketName(bucketId) {
  try {
    const stmt = db.prepare("SELECT name FROM bucket WHERE id = @id");
    const row = stmt.get({ id: bucketId });

    return row.name;
  } catch (err) {
    errorLogger.log(err); 
    throw err;
  }
}

function downloadMedia(media) {
  let dbErr;
  let targetMedia = []; 
  for (let medium of media) {
    let ext = removeExt(medium.name);
    if (imageMap.get(ext) !== undefined) {
      let percentage = scoringAlgo(medium.size, medium.score);
      medium.chunk_size = Math.ceil(medium.size * percentage);
      targetMedia.push(medium);
    } else {
      medium.chunk_size = medium.size;
      targetMedia.push(medium);
    }
  }

  let currentMedia = new Map();
  try {
    const stmt = db.prepare("SELECT * FROM local_store");
    const rows = stmt.all();

    for (let row in rows) {
      currentMedia.set(row.media_id, row);
    }
  } catch (err) {
    errorLogger.log(err);
    throw err;
  }

  let toDelete = [];
  let toCreate = [];
  for (let medium of targetMedia) {
    if (currentMedia.has(medium.id) && currentMedia.get(medium.id).chunk_size === medium.chunk_size && currentMedia.get(medium.id).bucket_id === medium.bucket_id) {
      currentMedia.delete(medium.id);
    } else {
      toCreate.push(medium);
    }
  }
  for (let key of currentMedia.keys()) {
    toDelete.push(currentMedia.get(key));
  }

  // Delete media
  for (let medium of toDelete) {
    try {
      const stmt = db.prepare("DELETE FROM local_store WHERE id = @id");
      stmt.run({
        id: medium.id
      });
    } catch (err) {
      errorLogger.log(err);
      throw err;
    }
    fs.rm(
      `server/media/${getBucketName(medium.bucket_id).replace(/\//g, "\\/\\")}/${medium.name}`,
      { force: true, recursive: true },
      (err) => {
        errorLogger.log(err);
        dbErr = err;
      }
    );
    if (dbErr) {
      throw dbErr;
    }
  }
  // Create media
  for (let medium of toCreate) {
    try {
      let bucketName = getBucketName(medium.bucket_id);

      storageConnector.getMediaNormal(bucketName, medium.name, 0, medium.chunk_size - 1)
      .then((res) => {
        let stream = fs.createWriteStream(`server/media/${bucketName.replace(/\//g, "\\/\\")}/${medium.name}`);
        res.Body.pipe(stream);
      })
      .catch((err) => {
        errorLogger.log(err);
        throw err;
      });

      const stmt = db.prepare("INSERT INTO local_store (name, chunk_size, media_id, bucket_id) VALUES (@name, @chunk_size, @media_id, @bucket_id)");
      stmt.run({
        name: medium.name,
        chunk_size: medium.chunk_size,
        media_id: medium.id, 
        bucket_id: medium.bucket_id
      });
    } catch (err) {
      errorLogger.log(err);
      throw err;
    }
  }
}

exports.update = function () {
  try {
    let dbErr;
    let buckets;
    retrieveBuckets()
      .then((data) => {
        buckets = data;

        updateBuckets(buckets);
        for (let bucket of buckets) {
          let mediaList;
          retrieveMedia(bucket.Name)
            .then((data) => {
              mediaList = data;

              updateMedia(bucket.Name, mediaList);
              downloadMedia(computeMediaScores());
            })
            .catch((err) => {
              errorLogger.log(err);
              dbErr = err;
            });
          if (dbErr) {
            throw dbErr;
          }
        }
      })
      .catch((err) => {
        errorLogger.log(err);
        dbErr = err;
      });
    if (dbErr) {
      throw dbErr;
    }
  } catch (err) {
    errorLogger.log(err);
  }
};