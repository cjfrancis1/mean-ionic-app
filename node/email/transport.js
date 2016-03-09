"use strict";

module.exports = function (nodemailer, sendGridTransport, config) {
  const options = {
    auth: {
      api_user: config.sendGridUsername,
      api_key: config.sendGridPassword
    }
  };

  return nodemailer.createTransport(sendGridTransport(options));
};
