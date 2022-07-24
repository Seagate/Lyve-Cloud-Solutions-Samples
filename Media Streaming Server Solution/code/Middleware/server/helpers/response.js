const httpStatus = require("http-status");

function success(res, msg, data) {
  const response = {
    success: true,
    msg,
    data,
  };
  return res.status(httpStatus.OK).json(response);
}

function failRequest(res, msg, error) {
  const response = {
    success: false,
    msg,
    error,
  };
  return res.status(httpStatus.OK).json(response);
}
function failedRequest(res, msg, error) {
  const response = {
    success: false,
    msg,
    error,
  };
  return res.status(httpStatus.BAD_REQUEST).json(response);
}
function badRequest(res, msg, errors) {
  const response = {
    msg,
    errors,
  };
  return res.status(httpStatus.BAD_REQUEST).json(response);
}

function unauthorizedRequest(res, msg, errors) {
  const response = {
    msg,
    errors,
  };
  return res.status(httpStatus.UNAUTHORIZED).json(response);
}

module.exports = {
  success,
  failRequest,
  failedRequest,
  badRequest,
  unauthorizedRequest,
};
