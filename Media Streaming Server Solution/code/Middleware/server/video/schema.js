const Joi = require('joi');

module.exports = {
  getVideo: {
    params: {
      key: Joi.string().required(),
    },
  },
};
