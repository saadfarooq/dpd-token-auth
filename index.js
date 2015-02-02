var util = require('util'),
  Resource = require('deployd/lib/resource'),
  _ = require('underscore'),
  jwt = require('jsonwebtoken'),
  google = require('./google'),
  debug = require('debug')('token-auth');

var self;

function TokenAuth(name, options) {
  Resource.apply(this, arguments);
  self = this;
}
util.inherits(TokenAuth, Resource);

TokenAuth.events = _.clone(Resource.events);
TokenAuth.dashboard = Resource.dashboard;

TokenAuth.prototype.handle = function(ctx) {
  if (ctx.req.method == "GET" && (ctx.url === '/count' || ctx.url.indexOf('/index-of') === 0)) {
    return Resource.prototype.handle.apply(self, arguments);
  }

  if (ctx.url === '/logout') {
    if (ctx.res.cookies) ctx.res.cookies.set('sid', null, {
      overwrite: true
    });
    ctx.session.remove(ctx.done);
    return;
  }

  if (ctx.req.method == "POST") {
    self.handleLogin(ctx);
  }
};

TokenAuth.prototype.handleLogin = function(ctx) {
  function done(err, user) {
    if (err) ctx.done(err);
    ctx.done(null, {
      token: jwt.sign({ uid: user.id }, self.config.serverSecret,
        {
          expiresInMinutes: self.config.tokenExpiry || 24 * 60 ,
          issuer: 'urn:deployd'
        })
    });
  };

  if (ctx.url === '/google') {
    google.handleLogin(ctx.body, self.config, done);
  }
};

/**
 *
 * Get Bearer token from Authorization header and save token owner to session
 *
 * @param {Context} ctx
 * @param callback fn
 */
TokenAuth.prototype.handleSession = function(ctx, fn) {
  var session = ctx.session,
    req = ctx.req;

  // make our own done callback
  function done(err, result) {
    debug('err: %j', err);
    debug('result: %j', result);
    if (err) return ctx.done(err);
    ctx.session.user = result;
    ctx.session.data.uid = result.id;
    ctx.done(null, result);
  };

  if (req.headers && req.headers.authorization) {
    // remove existing session
    session.remove(function() {});
    var parts = req.headers.authorization.split(' ');
    if (parts.length == 2) {
      var scheme = parts[0],
        token = parts[1];
      if (/^Bearer$/i.test(scheme)) {
        debug('Bearer token: %s', token);
        if (!token || token == 'undefined') return fn();
        self.validateToken(token, done);
      }
    } else {
      done('Request does not contain a bearer token authorization');
    }
  } else {
    debug('No authorization headers provided');
    fn(); // continue processing
  }
};
/**
 *
 * Validates JWT token, extracts user's information and sets it to the session user
 *
 * @param {String} token
 * @param Callback fn
 */
TokenAuth.prototype.validateToken = function(token, fn) {
  self.userCollection = process.server.resources.filter(function(res) {
    return res.config.type === 'UserCollection'
  })[0];
  jwt.verify(token, self.config.serverSecret, { issuer: 'urn:deployd'},
    function(err, decoded) {
      if (err) return fn(err);
      debug('decoded jwt payload: %j', decoded);
      // get the user from id
      self.userCollection.store.first({
        id: decoded.uid
      }, fn);
    });
};

TokenAuth.prototype.tokenExpired = function(user, fn) {
  // Remove expired token
  user.token = {};

  function done(err, result) {
    if (err) fn(err);
    fn({
      error: 'Token expired. Reauthenticate'
    });
  }
  self.updateUser(user, done);
};

TokenAuth.label = 'Token Auth Resource';
TokenAuth.defaultPath = '/auth';
TokenAuth.prototype.clientGeneration = true;
TokenAuth.prototype.clientGenerationExec = ['google'];

TokenAuth.basicDashboard = {
  settings: [{
    name: 'tokenExpiry',
    type: 'number',
    description: 'The time duration for tokens to expire (in minutes). Defaults to 24 hours.'
  }, {
    name: 'serverSecret',
    type: 'text',
    description: 'The secret used for signing tokens'
  }, {
    name: 'googleClientID',
    type: 'text',
    description: 'Your app\'s Google client ID'
  }, {
    name: 'googleClientSecret',
    type: 'text',
    description: 'Your app\'s Google client secret'
  }]
};

module.exports = TokenAuth;
