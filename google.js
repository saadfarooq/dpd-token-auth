var google = require('googleapis'),
  internalClient = require('deployd/lib/internal-client'),
  plus = google.plus('v1'),
  debug = require('debug')('token-auth-google');

module.exports.handleLogin = function(params, config, done) {
  var REDIRECT_URI = "postmessage";
  var oauth2Client = new google.auth.OAuth2(config.googleClientID,
    config.googleClientSecret, REDIRECT_URI);
  var userCollection = process.server.resources.filter(function(res) {
    return res.config.type === 'UserCollection'
  })[0];

  var createUser = function(saveUser) {
    dpd = internalClient.build(process.server, {
      isRoot: true
    }, []),

    // we need to fake the password here, because deployd will force us to on create
    // but we'll clear that later
    saveUser.password = 'somepass';
    dpd.users.put(saveUser, function(res, err) {
      if (err) {
        return done(err);
      }
      // before actually progressing the request, we need to clear username + password for social users
      userCollection.store.update({
        id: res.id
      }, {
        password: null
      }, function() {
        done(null, res || saveUser);
      });
    });
  };

  var getGoogleUser = function(accessToken) {
    oauth2Client.setCredentials({
      access_token: accessToken
    });

    plus.people.get({
      userId: 'me',
      auth: oauth2Client
    }, function(err, res) {
      if (err) {
        done(err);
      }
      userCollection.store.first({
        username: 'google_' + res.id
      }, function(err, user) {
        if (user) {
          debug('Found existing user');
          // return the user if one already exists
          done(null, user);
        } else {
          // create new user
          debug('Writing new user %s', res.id);
          createUser({
            'email': res.emails[0].value,
            'username': 'google_' + res.id,
            'firstName': res.name.givenName,
            'lastName': res.name.familyName,
            'displayName': res.displayName,
            'imageUrl': res.image.url
          });
        }
      });
    });
  };

  oauth2Client.getToken(params.code, function(err, tokens) {
    if (err) {
      done(err);
    } else {
      getGoogleUser(tokens.access_token);
    }
  });
};
