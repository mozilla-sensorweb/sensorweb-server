# SensorWeb API

This document provides protocol-level details of the SensorWeb API.

---

# HTTP API

## URL Structure

All requests will be to URLs of the form:

    https://<host-url>/api/v1/<api-endpoint>

Note that:

* All API access must be over a properly-validated HTTPS connection.
* The URL embeds a version identifier "v1"; future revisions of this API may introduce new version numbers.

## Request Format

All POST requests must have a content-type of `application/json` with a utf8-encoded JSON body.

### Authentication

Requests that require user authentication must contain a header including a signed [JWT](https://jwt.io).

Use the JWT with this header:

```js
{
    "Authorization": "Bearer <jwt>"
}
```

For example:

```curl
curl 'http://localhost:3000/api/v1/clients' -H 'Accept: application/json' -H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJraWQiOm51bGwsImFsZyI6IkhTMjU2In0.eyJpZCI6MiwibmFtZSI6ImFkbWluIn0.JNtvokupDl2hdqB+vER15y89qigPc4FviZfJOSR1Vso'
```

## Response Format
All successful requests will produce a response with HTTP status code of "20X" and content-type of "application/json".  The structure of the response body will depend on the endpoint in question.

Failures due to invalid behavior from the client will produce a response with HTTP status code in the "4XX" range and content-type of "application/json".  Failures due to an unexpected situation on the server side will produce a response with HTTP status code in the "5XX" range and content-type of "application/json".

To simplify error handling for the client, the type of error is indicated both by a particular HTTP status code, and by an application-specific error code in the JSON response body.  For example:

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
* status code 400, errno 100: Invalid client API name. Missing or malformed client API name.
* status code 401, errno 401: Unauthorized. If credentials are not valid.
* status code 403, errno 403: Forbidden. The server understood the request, but is refusing to fulfill it. Authorization will not help and the request SHOULD NOT be repeated.
* status code 500, errno 500: Internal server error.

# API Endpoints

* Login
  * [POST /users/auth](#post-usersauth)
* API clients management
  * [POST /clients](#post-clients) :lock: (admin scope required)
  * [GET /clients](#get-clients) :lock: (admin scope required)
  * [DELETE /clients/:key](#delete-clientskey) :lock: (admin scope required)

## POST /users/auth
Authenticates a user. So far only an admin user is allowed.
### Request
Requests must include a [basic authorization header](https://en.wikipedia.org/wiki/Basic_access_authentication#Client_side) with `username:password` encoded in Base64.
```ssh
POST /api/users/auth HTTP/1.1
Authorization: Basic YWRtaW46QXZhbGlkUGFzc3dvcmQuMA==
Cache-Control: no-cache
```
### Response
Successful requests will produce a "201 Created" response with a session token in the form of a [JWT]() with the following data:
```js
{
  "id": "admin",
  "scope": "admin",
  "iat": 1474647759
}
```

The token is provided in the body of the response:

```ssh
Connection: keep-alive
Content-Length: 156
Content-Type: application/json; charset=utf-8
Date: Fri, 23 Sep 2016 16:22:39 GMT
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwic2NvcGUiOiJhZG1pbiIsImlhdCI6MTQ3NDY0Nzc1OX0.R1vQOLVg8A-6i5QaZQVOGAzImiPvgAdkWiODYhYiNn4"
}
```

## POST /clients
Creates a new API client.
### Request
___Parameters___
* name - API client name.

```ssh
POST /api/clients HTTP/1.1
Content-Type: application/json
Cache-Control: no-cache
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwic2NvcGUiOiJhZG1pbiIsImlhdCI6MTQ3NDY0Nzc1OX0.R1vQOLVg8A-6i5QaZQVOGAzImiPvgAdkWiODYhYiNn4
{
	"name": "SensorWebClient"
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
GET /api/clients HTTP/1.1
Cache-Control: no-cache
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
        "key": "766a06dab7358b6aec17891df1fe8555"
    }
]
```

## DELETE /clients/:key
Deletes a registered API client given its identifier.

### Request
```ssh
DELETE /api/clients/766a06dab7358b6aec17891df1fe8555 HTTP/1.1
Host: localhost:8080
Cache-Control: no-cache
```

### Response
Successful requests will produce a "204 No Content" response.
