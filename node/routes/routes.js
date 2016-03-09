"use strict";

module.exports = function(app, router, passport, jwt, UsersModel, bcrypt, mailer, generatePassword) {

  let usersSelect = '-_id firstName lastName email profilePic bio twitterHandle niches status',
      noReplyAddress = `noreply@${app.get('domain')}`;

  function _template(data) {
    if (data.status === 200 && !data.errors) {
      return {
        "status": data.status,
        "recordCount": data.recordCount && typeof data.response === 'object' && data.response.length ? data.response.length : null,
        "response": data.response,
        "errors": []
      };
    } else {
      return {
        "status": data.status,
        "recordCount": null,
        "response": null,
        "errors": data.errors
      };
    }
  }

  function sendVerificationEmail(data) {
    return new Promise((resolve, reject) => {

      let emailAddress = data.email.trim().toLowerCase(),
          token = jwt.sign({email: emailAddress}, app.get('userSecret'), {
            expiresIn: 1440 * 60 // expires in 24 hours
          }),
          verificationURL = `${app.get('host')}/email_verification?token=${token}`,
          email = {
            to: emailAddress,
            from: noReplyAddress,
            subject: 'Email Verification',
            text: `Click this link to verify your email address: ${verificationURL}`,
            html: `<b>Click this link to verify your email address:</b> <a href="${verificationURL}">${verificationURL}</a>`
          };

      mailer.sendMail(email, function(err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", ["Content-Type", "Authorization"]);
    next();
  });

  app.post('/authenticate', function (req, res, next) {
    passport.authenticate('local', { session: false }, function(err, user, info) {
      if (err) { console.error(err); }
      if (!user) {
        let errors = [];
        if (info) errors.push(info.message);
        return res.json(_template({status: 401, errors: errors}));
      }
      let token = jwt.sign({id: user._id}, app.get('userSecret'), {
        expiresIn: 1440 * 60 // expires in 24 hours
      });
      res.json(_template({status: 200, errors: false, response: token}));
    })(req, res, next);
  });

  app.post('/register_user', function (req, res) {
    if (req.body.email) {
      (function () {
        return new Promise((resolve, reject) => {
          UsersModel.find(
              {email: req.body.email}, (err, user) => {
                if (err) {
                  reject(err);
                } else {
                  if (user && user.length) {
                    reject({custom: 'There is already a user registered with the provided email.'});
                  } else {
                    resolve();
                  }
                }
              });
        });
      })()
          .then(() => {
            return new Promise((resolve, reject) => {
              UsersModel.create({
                      firstName: req.body.firstName.trim().toLowerCase(),
                      lastName: req.body.lastName.trim().toLowerCase(),
                      email: req.body.email.trim().toLowerCase(),
                      password: bcrypt.hashSync(req.body.password.trim(), 10),
                      twitterHandle: req.body.twitterHandle.trim().replace('@', '')
                    }, function(err, user) {
                if (err) {
                  reject(err);
                } else {
                  resolve(user);
                }
              });
            });
          })
          .then(sendVerificationEmail)
          .then(() => {
            res.json(_template({status: 200, errors: false, response: {success: true}}))
          })
          .catch(err => {
            if (err.custom) {
              res.json(_template({status: 500, errors: [err.custom]}));
            } else {
              console.log(err);
            }
          });
    } else {
      return res.json(_template({status: 500, errors: ['No user info provided.']}));
    }
  });

  app.post('/send_verification_email', function (req, res) {
    if (req.body.email) {
      sendVerificationEmail(req.body)
          .then(() => {
            res.json(_template({status: 200, errors: false, response: {success: true}}));
          })
          .catch(() => {
            if (err.custom) {
              res.json(_template({status: 500, errors: [err.custom]}));
            } else {
              console.log(err);
            }
          });
    } else {
      return res.json(_template({status: 500, errors: ['No email provided']}));
    }
  });

  app.post('/reset_password', function (req, res) {
    if (req.body.email) {
      (() => {
        return new Promise((resolve, reject) => {
          let newPassword = generatePassword(10, false),
              encryptedNewPassword = bcrypt.hashSync(newPassword, 10);
          UsersModel.findOneAndUpdate(
              {email: req.body.email, status: 'active'}, {password: encryptedNewPassword}, (err, user) => {
                if (err) {
                  reject(err);
                } else {
                  if (user) {
                    resolve(newPassword);
                  } else {
                    reject({custom: 'There is no active user with the provided email.'});
                  }
                }
              });
        });
      })()
      .then(newPassword => {
        return new Promise((resolve, reject) => {
          let appName = app.get('appFrontFacingName'),
              email = {
            to: req.body.email,
            from: noReplyAddress,
            subject: 'Reset Password',
            text: `Hi there,
You've recently asked to change your ${appName} password.
Here's your new password: ${newPassword}
This password may be a little hard to remember; it is for your security. But don't worry—you can always change this new password if you don't like it. Just go to your ${appName} profile page to edit.
Hope to see you on ${appName} soon!`,
            html: `Hi there,<br />
You've recently asked to change your ${appName} password.<br />
Here's your new password: <b>${newPassword}</b><br />
This password may be a little hard to remember; it is for your security. But don't worry—you can always change this new password if you don't like it. Just go to your ${appName} profile page to edit.<br />
Hope to see you on ${appName} soon!`
          };

          mailer.sendMail(email, function(err, res) {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        });
      })
          .then(() => {
            res.json(_template({status: 200, errors: false, response: {success: true}}));
          })
          .catch(err => {
            if (err.custom) {
              res.json(_template({status: 500, errors: [err.custom]}));
            } else {
              console.log(err);
            }
          });
    } else {
      return res.json(_template({status: 500, errors: ['No email provided.']}));
    }
  });

  app.get('/email_verification', function (req, res) {
    if (req.query.token) {
      let token = req.query.token;

      (function () {
        return new Promise((resolve, reject) => {
          jwt.verify(token, app.get('userSecret'), function(err, decoded) {
            if (err) {
              reject({custom: 'Sorry, But the email verification link has expired or is invalid.'});
            } else {
              resolve(decoded);
            }
          });
        });
      })()
          .then((decoded) => {
            return new Promise ((resolve, reject) => {
              UsersModel.findOne({email: decoded.email}, 'email emailVerified status',
                  function (err, user) {
                    if (err) {
                      reject(err);
                    } else {
                      if (user) {
                        resolve(user);
                      } else {
                        reject({custom: 'Sorry, But the email verification link has expired or is invalid.'});
                      }
                    }
                  })
            });
          })
          .then((user) => {
            return new Promise ((resolve, reject) => {
              if (user.emailVerified === false) {
                if (user.status === 'approved') {
                  UsersModel.findOneAndUpdate({_id: user._id}, {emailVerified: true, status: 'active'}, function (err, user) {
                    if (err) {
                      reject(err);
                    } else if (user) {
                      resolve(user);
                    }
                  });
                } else {
                  UsersModel.findOneAndUpdate({_id: user._id}, {emailVerified: true}, function (err, user) {
                    if (err) {
                      reject(err);
                    } else if (user) {
                      resolve(user);
                    }
                  });
                }
              } else {
                reject({custom: `This email address '${user.email}' has already been verified.`})
              }
            });
          })
          .then((user) => {
            return res.render('email_verification', {body: {message: `Successfully verified the following email address: '${user.email}'.`}});
          })
          .catch(err => {
            if (err.custom) {
              return res.render('email_verification', {body: {message: err.custom}});
            } else {
              return console.log(err);
            }
          });
    } else {
      return res.render('email_verification', {body: {message: 'Sorry, But no email verification token was provided.'}});
    }
  });

  router.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    let token = req.body.token || req.params.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : undefined);

    // decode token
    if (token) {

      // verifies secret and checks exp
      jwt.verify(token, app.get('userSecret'), function(err, decoded) {
        if (err) {
          return res.json({ success: false, message: 'Failed to authenticate token.' });
        } else {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded;
          next();
        }
      });

    } else {

      // if there is no token
      // return an error
      return res.json(_template({status: 403, errors: ['No Token Provided.']}));

    }

  });

  router.get('/users/:userId', function(req, res){
    UsersModel.findOne({_id: req.params.userId},
        usersSelect,
        function (err, result) {
      if (err) {
        console.error(err);
        res.json(_template({status: 500, errors: ["The given Id was invalid."]}));
      } else {
        if (!result) {
          res.json(_template({status: 404, errors: ["Could not find the user with the given Id."]}));
        } else {
          res.json(_template({status: 200, errors: false, response: result}));
        }
      }
    });
  });

  router.get('/users', function(req, res){
    UsersModel.find({}, usersSelect, function (err, result) {
      if (err) {
        console.error(err);
        res.json(_template({status: 500, errors: ["There was an issue retrieving the list of users."]}));
      } else {
        res.json(_template({status: 200, errors: false, response: result, recordCount: true}));
      }
    });
  });

  app.use('/api', router);
};
