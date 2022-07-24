const VideoService = require('./video.service');
const Response = require('../helpers/response');
const logService = require('../logs/logs.service');

async function getVideos(req, res) {
  try {
    const videos = await VideoService.getVideos();
    logService.saveLog({
      type: 'Success',
      message: 'Retrived the videos successfully',
    });
    Response.success(res, 'Successfully fetched the videos', videos);
    // next();
  } catch (errRes) {
    logService.saveLog({ type: 'Error', message: errRes.message });
    Response.failRequest(res, 'Failed to get the videos', errRes.error);
    // next();
  }
}

async function getVideo(req, res) {
  try {
    const { key } = req.params;
    const range = req.headers.range;

    await VideoService.getVideo({ key, res, range });
    // next();
  } catch (errRes) {
    console.log({ errRes });
    logService.saveLog({ type: 'Error', message: errRes.message });
    Response.failRequest(res, 'Failed to get the video', errRes.error);
    // next();
  }
}

async function getVideoUploadUrl(req, res) {
  try {
    const { key, type, numberOfparts } = req.body;
    const videoUrl = await VideoService.initiateMultiPartUpload(
      key,
      type,
      numberOfparts
    );
    Response.success(res, 'Successfully fetched the videos', videoUrl);
    // next();
  } catch (errRes) {
    console.log({ errRes });
    Response.failRequest(res, 'Failed to get the video', errRes.error);
    // next();
  }
}
async function completeMultiUpload(req, res) {
  try {
    const { UploadId, parts, key } = req.body;
    const videoUrl = await VideoService.completeMultiUpload({
      UploadId,
      parts,
      key,
    });
    Response.success(res, 'Successfully fetched the videos', videoUrl);
    // next();
  } catch (errRes) {
    console.log({ errRes });
    Response.failRequest(res, 'Failed to get the video', errRes.error);
    // next();
  }
}
async function completeMultiUpload(req, res) {
  try {
    const { UploadId, parts, key } = req.body;
    const videoUrl = await VideoService.completeMultiUpload({
      UploadId,
      parts,
      key,
    });
    Response.success(res, 'Successfully fetched the videos', videoUrl);
    // next();
  } catch (errRes) {
    console.log({ errRes });
    Response.failRequest(res, 'Failed to get the video', errRes.error);
    // next();
  }
}
async function deleteVideo(req, res) {
  try {
    const { key } = req.params;
    const videoUrl = await VideoService.deleteVideo({
      key,
    });
    Response.success(res, 'Successfully deleted the videos', videoUrl);
    // next();
  } catch (errRes) {
    console.log({ errRes });
    Response.failRequest(res, 'Failed to delete the video', errRes.error);
    // next();
  }
}
module.exports = {
  getVideos,
  getVideo,
  getVideoUploadUrl,
  completeMultiUpload,
  deleteVideo,
};
