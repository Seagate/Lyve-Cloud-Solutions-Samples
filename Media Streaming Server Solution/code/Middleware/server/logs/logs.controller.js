const logsService = require('./logs.service');
const Response = require('../helpers/response');

async function getLogs(req, res) {
  try {
    const log = await logsService.getLogs();
    Response.success(res, 'Successfully fetched the log', log);
    // next();
  } catch (errRes) {
    console.log({ errRes });

    Response.failRequest(res, 'Failed to get the logs', errRes.error);
    // next();
  }
}
async function getLog(req, res) {
  try {
    const { key } = req.params;
    const log = await logsService.getLog({ key });
    Response.success(res, 'Successfully fetched the log', log);
    // next();
  } catch (errRes) {
    console.log({ errRes });

    Response.failRequest(res, 'Failed to get the logs', errRes.error);
    // next();
  }
}
async function saveLog(req, res) {
  try {
    const log = await logsService.saveLog();
    Response.success(res, 'Successfully saved the log', log);
    // next();
  } catch (errRes) {
    console.log({ errRes });
    Response.failRequest(res, 'Failed to save the log', errRes.error);
    // next();
  }
}
async function deleteLogs(req, res) {
  try {
    const log = await logsService.deleteLogs();
    Response.success(res, 'Successfully saved the log', log);
    // next();
  } catch (errRes) {
    console.log({ errRes });
    Response.failRequest(res, 'Failed to save the log', errRes.error);
    // next();
  }
}
module.exports = {
  getLogs,
  getLog,
  saveLog,
  deleteLogs,
};
