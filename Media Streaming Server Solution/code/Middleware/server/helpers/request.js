const axios = require('axios');
const apiCall = (meta, baseUrl, data) => {
  return new Promise(function (resolve, reject) {
    // Some imaginary 2000 ms timeout simulating a db call
    axios({
      method: meta.method,
      url: `${baseUrl}meta.path`,
      data,
    }).then(function (response) {
      resolve(response.data);
    });
  });
};
module.exports = apiCall;
