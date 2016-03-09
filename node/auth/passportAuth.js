module.exports = function (passport, LocalStrategy, config, UsersModel, bcrypt) {
  passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
      },
      function (email, password, done) {
        UsersModel.findOne({ email: email }, '_id email password status', function(err, user) {
          if (err) { return done(err); }
          if (!user) {
            return done(null, false, { message: 'Incorrect email.' });
          }
          if (!bcrypt.compareSync(password, user.password)) {
            return done(null, false, { message: 'Incorrect password.' });
          }
          if (user.status !== 'active') {
            return done(null, false, { message: 'Inactive user.' });
          }
          return done(null, user);
        });
      } 
  ));
};