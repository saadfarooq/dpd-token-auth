# dpd-token-auth
A [Deployd](http://deployd.com/) resource that enables authentication using a Bearer token Authorization header in your requests.

    Http-headers
    ...
    Authorization: Bearer yhak3Yh5ciFYdaf
    ...

The resource does two things: 
    - Produces endpoints for logging in with different services (currently only the Google hybrid sign-in is available). These endpoints return JWT's identifying the user (or a newly created one if none exists)
    -  Authenticates a user based on token passed through authorization header and sets deployd's `me` variable to that user if authentication succeeds.

## Google
To log-in with Google, send the authorization code returned during Google's hybrid sig-in flow to the server using a post request to `[resource_path]/google` or using the client side `dpd` client using `dpd.[resource_path].google`, e.g.

    dpd.auth.google({code: 2jk6l345hulk5y23o1urhjf }).then(...).fail(...);

If the request is successful, you will get back a JWT to include in future requests. Currently, the `dpd` front-end client does not have a way of including this header so you will have to use other mechanism for now.

The following `UserCollection` properties are written from the user's Google profile.

    {
      "type": "UserCollection",
      "properties": {
        "email": {
          "name": "email",
          "type": "string",
          "typeLabel": "string",
          "required": false,
          "id": "email",
          "order": 0
        },
        "firstName": {
          "name": "firstName",
          "type": "string",
          "typeLabel": "string",
          "required": false,
          "id": "firstName",
          "order": 1
        },
        "lastName": {
          "name": "lastName",
          "type": "string",
          "typeLabel": "string",
          "required": false,
          "id": "lastName",
          "order": 2
        },
        "displayName": {
          "name": "displayName",
          "type": "string",
          "typeLabel": "string",
          "required": false,
          "id": "displayName",
          "order": 3
        },
        "imageUrl": {
          "name": "imageUrl",
          "type": "string",
          "typeLabel": "string",
          "required": false,
          "id": "imageUrl",
          "order": 4
        }
      }
    }

## Installing
Install via npm

    npm install --save dpd-token-auth

The package needs to be listed in your project's `package.json` for Deployd to acknowledge it.

## Todos
  - Currently, the plugin only supports one token per user. Need to extend this to support multiple tokens so each client uses a different token. This might involve generating `client_id`'s
