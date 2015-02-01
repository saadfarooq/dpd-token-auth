# dpd-token-auth
A (Deployd)[http://deployd.com] resource that enables authentication using a Bearer token Authorization header in your requests.

    Http-headers
    ...
    Authorization: Bearer yhak3Yh5ciFYdaf
    ...

The resource does two things: 
    - Produces endpoints for logging in with different services (currently only the Google hybrid sign-in is available). These endpoints return JWT's identifying the user (or a newly created one if none exists)
    -  Reads a Json web token passed as through the authorization and reads sets the user identified by that token to deployd's `me` variable

## Google
To log-in with Google, send the authorization code returned during Google's hybrid sig-in flow to the server using a post request to `[resource_name]/google` or using the client side `dpd` client using `dpd.[resource_name].google`, e.g.

    dpd.auth.google({code: 2jk6l345hulk5y23o1urhjf }).then(...).fail(...);

If the request is successful, you will get back JWT to include in future requests. Currently, the `dpd` front-end client does not have a way of including this header so you will have to use other mechanism for now.

## Installing
Install via npm

    npm install --save dpd-token-auth

The package needs to be listed in your project's `package.json` for Deployd to acknowledge it.

## Todos
  - Currently, the plugin only supports one token per user. Need to extend this to support multiple tokens so each client uses a different token. This might involve generating `client_id`'s
