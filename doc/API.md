# SensorWeb API

This document provides protocol-level details of the SensorWeb API.

---

# HTTP API

## URL Structure

All requests will be to URLs of the form:

    https://<host-url>/<api-version>/<api-endpoint>

Note that:

* All API access must be over a properly-validated HTTPS connection.
* The URL embeds a version identifier "v1.0"; future revisions of this API may
introduce new version numbers.

## Request Format

All POST requests must have a content-type of `application/json` with a 
utf8-encoded JSON body.

### Authentication

Requests that require user authentication must contain a header including a 
signed [JWT](https://jwt.io).

Use the JWT with this header:

```js
{
    "Authorization": "Bearer <jwt>"
}
```

For example:

```curl
curl 'http://localhost:3000/v1.0/clients' \
-H 'Accept: application/json' \
-H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJraWQiOm51bGwsImFsZyI6IkhTMjU2In0.eyJpZCI6MiwibmFtZSI6ImFkbWluIn0.JNtvokupDl2hdqB+vER15y89qigPc4FviZfJOSR1Vso'
```

## Response Format
All successful requests will produce a response with HTTP status code of "20X" 
and content-type of "application/json".  The structure of the response body 
will depend on the endpoint in question.

Failures due to invalid behavior from the client will produce a response with 
HTTP status code in the "4XX" range and content-type of "application/json".  
Failures due to an unexpected situation on the server side will produce a 
response with HTTP status code in the "5XX" range and content-type of 
"application/json".

To simplify error handling for the client, the type of error is indicated both 
by a particular HTTP status code, and by an application-specific error code in 
the JSON response body.  For example:

```js
{
  "code": 400, // matches the HTTP status code
  "errno": 777, // stable application-level error number
  "error": "Bad Request", // string description of the error type
  "message": "the value of salt is not allowed to be undefined"
}
```

Responses for particular types of error may include additional parameters.

The currently-defined error responses are:

* status code 400, errno 400: Bad request.
* status code 400, errno 100: Invalid client API name. Missing or malformed 
client API name.
* status code 400, errno 100: Invalid client API redirection URL. Malformed 
client API redirection URL.
* status code 401, errno 401: Unauthorized. If credentials are not valid.
* status code 403, errno 403: Forbidden. The server understood the request, 
but is refusing to fulfill it. Authorization will not help and the request 
SHOULD NOT be repeated.
* status code 500, errno 500: Internal server error.

# API Endpoints

* Login
  * [GET /auth/basic](#post-authbasic) :lock: (client signed token required)
  * [GET /auth/facebook](#get-authfacebook) :lock: (client signed token required)
* API clients management
  * [POST /clients](#post-clients) :lock: (admin scope required)
  * [GET /clients](#get-clients) :lock: (admin scope required)
  * [DELETE /clients/:key](#delete-clientskey) :lock: (admin scope required)
* Permissions
  * [GET /permissions](#get-permissions) :lock: (admin scope required)

## GET /auth/basic
Authenticates a user using username and password. So far only an admin user is
allowed.
### Request
Requests must include a JWT signed with a valid client secret as the
`authToken` query parameter.

```ssh
GET /v1.0/auth/basic?authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbn
RJZCI6IjhlYWYxMjQ1MTEzNGIyNGUiLCJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiIxLkxv
bmdhZG1pbnBhc3MuMSIsInNjb3BlcyI6ImFkbWluIn0.foaQeXQGt5_8wFmW5mH9wdQLE3VKHwH9oD
clmUroWRk HTTP/1.1
```

The payload of the signed JWT must include the following information:
* `clientKey`: client identifier, aka his key.
* `scopes`: the list of permissions the client is asking for for this token.

### Response
Successful requests will produce a 200 response with a session token
in the form of a [JWT](https://jwt.io/) with the following data:
```json
{
  "clientKey": "8eaf12451134b24e",
  "scopes": ["admin"]
}
```

The token is provided in the body of the response:

```ssh
Connection: keep-alive
Content-Length: 156
Content-Type: application/json; charset=utf-8
Date: Fri, 23 Sep 2016 16:22:39 GMT
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6IjhlYWYxMjQ1MTE
            zNGIyNGUiLCJzY29wZXMiOlsiYWRtaW4iXSwiaWF0IjoxNDc0NjQ3NzU5fQ.ZxnRCbuw
            yCypJMnAHHhpwSL_-y19Q4DSioA1cnB9JyY"
}
```

## GET /auth/facebook
Authenticates a user using his Facebook account.
### Request
Requests must include a JWT signed with a valid client secret as the 
`authToken` query parameter.

```ssh
GET /v1.0/auth/facebook?authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb
GllbnRJZCI6IjEyMzQ1Njc4OTAiLCJzY29wZXMiOlsidXNlci1mYXZvcml0ZXMiXSwiYXV0aFJlZ
GlyZWN0VXJscyI6WyJodHRwczovL2RvbWFpbi5vcmcvYXV0aC9zdWNjZXNzIl0sImF1dGhGYWlsd
XJlVXJscyI6WyJodHRwczovL2RvbWFpbi5vcmcvYXV0aC9lcnJvciJdfQ.e7rYEZsQNLG0aTjDRH
sQ2xembu3fyVe-B9bm8mFprwQ HTTP/1.1
```

The payload of the signed JWT must include the following information:
* `clientKey`: client identifier, aka his key.
* `scopes`: the list of permissions the client is asking for for this token.
* `redirectUrl`: the URL you would like to be redirected after a
    successful login. This URL needs to be associated with your client
    information first. It will gets the user's JWT as a query parameter `token`.
* `failureUrl` (optional): the URL you would like to be redirected
    after a failure. This URL needs to be associated with your client
    information first.

### Response
A successful request will redirect the user to the Facebook login page, where 
the user should enter her credentials. After a successful login the user 
will eventually be redirected to the URL specified in `redirectUrl` with a 
`token` query parameter containing a session token.

```ssh
https://domain.org/auth/success?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ
jbGllbnRJZCI6IjEyMzQ1NiIsInNjb3BlIjoidXNlciJ9.nU1LD8gyVxd8kjNJhLlEwhUbohVW3TQ1
T5hRvYamAiQ
```

This session token can be used in following requests that require user 
authentication and it is provided in the form of a signed [JWT](https://jwt.io/) 
with the following data:

```json
{
  "clientKey": "02e9c791d7",
  "scopes": ["sensorthings"]
}
```

## POST /clients
Creates a new API client.
### Request
___Parameters___
* name - API client name.
* authRedirectUrls (optional) - API client user authentication redirection URLs.
* authFailureRedirectUrls (optional) - API client user authentication failure redirection URLs.
* permissions (optional) - List of permissions the client is allowed to request.

```ssh
POST /v1.0/clients HTTP/1.1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwic2NvcGUiOiJhZG1pbiIsImlhdCI6MTQ3NDY0Nzc1OX0.R1vQOLVg8A-6i5QaZQVOGAzImiPvgAdkWiODYhYiNn4
{
    "name": "SensorWebClient",
    "authRedirectUrls": ["https://domain.org/auth/success"],
    "authFailureRedirectUrls": ["https://domain.org/auth/error"],
    "permissions": ["sensorthings-api"]
}
```

### Response
Successful requests will produce a "201 Created" response with a body containing the name and the generated API key and secret.

```ssh
Access-Control-Allow-Origin: *
Connection: keep-alive
Content-Length: 198
Content-Type: application/json; charset=utf-8
{
    "name": "SensorWebClient",
    "key": "766a06dab7358b6aec17891df1fe8555",
    "secret": "d21ddda92c7d40c3c3bbf2befe1f857de21e33b830714a73db9f223b04f7620e973848db25b097d1a09460a8ac1d180ea2d5ec724c9f021680ed8e50d99b0996"
}
```

## GET /clients
Get the list of registered API clients.

### Request
```ssh
GET /v1.0/clients HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwic2NvcGUiOiJhZG1pbiIsImlhdCI6MTQ3NDY0Nzc1OX0.R1vQOLVg8A-6i5QaZQVOGAzImiPvgAdkWiODYhYiNn4
```

### Response
Successful requests will produce a 200 response with an array containing the list of registered API clients.

```ssh
Access-Control-Allow-Origin: *
Connection: keep-alive
Content-Length: 60
Content-Type: application/json; charset=utf-8
[
    {
        "name": "SensorWebClient",
        "key": "766a06dab7358b6aec17891df1fe8555",
        "authRedirectUrls": ["https://domain.org/auth/success"],
        "authFailureRedirectUrls": ["https://domain.org/auth/error"],
        "permissions": ["sensorthings-api"]
    }
]
```

## DELETE /clients/:key
Deletes a registered API client given its identifier.

### Request
```ssh
DELETE /v1.0/clients/766a06dab7358b6aec17891df1fe8555 HTTP/1.1
Host: localhost:8080
```

### Response
Successful requests will produce a "204 No Content" response.

## GET /permissions
Get the list of client permissions.

### Request
```ssh
GET /v1.0/permissions HTTP/1.1
Host: localhost:8080
```

### Response
Successful requests will produce a 200 response with an array of permissions.
```ssh
Access-Control-Allow-Origin: *
Connection: keep-alive
Content-Length: 52
Content-Type: application/json; charset=utf-8
{
    "permissions": ["admin", "sensorthings-api"]
}
```

