const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');

require('dotenv').config();

passport.use(new LocalStrategy(
  function(username, password, done) {
    const envUsername = process.env.ADMINUSERNAME;
    const envPassword = process.env.PASSWORD;

    console.log('Input username:', username);
    console.log('Input password:', password);
    console.log('Environment username:', envUsername);
    console.log('Environment password:', envPassword);

    if (username === envUsername && password === envPassword) {
      return done(null, { username: envUsername });
    } else {
      console.log('Authentication failed');
      return done(null, false, { message: 'Incorrect username or password' });
    }
  }
));



passport.serializeUser(function(user, done) {
  done(null, user.username);
});

passport.deserializeUser(function(username, done) {
  done(null, { username: username });
});

module.exports = passport;
