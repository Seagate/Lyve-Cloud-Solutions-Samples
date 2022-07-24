const express = require('express');
const validate = require('express-validation');
const schema = require('./schema');
const videoCtrl = require('./video.controller');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/').get(videoCtrl.getVideos);
router.route('/:key').get(validate(schema.getVideo), videoCtrl.getVideo);
router.route('/get-video-upload-url').post(videoCtrl.getVideoUploadUrl);
router.route('/completeMultiUpload').post(videoCtrl.completeMultiUpload);
router.route('/delete/:key').delete(videoCtrl.deleteVideo);
module.exports = router;
