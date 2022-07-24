const express = require('express');
const logsCtrl = require('./logs.controller');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/').get(logsCtrl.getLogs);
router.route('/').post(logsCtrl.saveLog);
router.route('/:key').get(logsCtrl.getLog);
router.route('/').delete(logsCtrl.deleteLogs);
module.exports = router;
