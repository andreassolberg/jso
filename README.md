# JSO – OAuth 2.0 Client with Javascript

[![Build Status](https://travis-ci.org/andreassolberg/jso.svg?branch=master)](https://travis-ci.org/andreassolberg/jso)

<!-- * [JSO Documentation](http://oauth.no/jso/) --->

OAuth 2.0 from your javascript client web application or mobile application in a secure way. JSO is provided by [UNINETT AS](http://www.uninett.no), a non-profit company working for educational and research institutions in Norway.

*Version 4, (current master branch) is rather new. Check the `version1` branch for the older stable release.*



## Features

* Implements **OAuth 2.0 Implicit Flow**.
* AMD-compatible loading.
* No server component needed.
* Can handle multiple providers at once.
* Uses *HTML 5.0 localStorage* to cache Access Tokens. You do not need to implement a storage.
* Can prefetch all needed tokens with sufficient scopes, to start with, then tokens can be used for requests later. This way, you can be sure that you would not need to redirect anywhere in your business logic, because you would need to refresh an expired token.
* Excellent scope support.
* Caches and restores the hash, your application will not loose state when sending the user to the authorization endpoint.




## How to use

Install using npm:

```
npm install jso --save
```

To load the javascript, you could use the distributed UMD module:

```
<script type="text/javascript" src="dist/jso.js">
<script>
var optps = {};
var j = new jso.JSO();
</script>
```

Alternatively you can use ES6 import using webpack or similar:

```
import {JSO, Popup} from 'jso'

let j = new JSO({})
```


To start using JSO, you need to initialize a new JSO object with configuration for an OAuth 2.0 Provider:

```javascript
let client = new JSO({
	providerID: "google",
	client_id: "541950296471.apps.googleusercontent.com",
	redirect_uri: "http://bridge.uninett.no/jso/index.html",
	authorization: "https://accounts.google.com/o/oauth2/auth",
	scopes: { request: ["https://www.googleapis.com/auth/userinfo.profile"]}
})
```

Options to JSO constructor

* `providerID`: OPTIONAL This is just a name tag that is used to prefix data stored in the browser. It can be anything you'd like :)
* `client_id`: The client idenfier of your client that is trusted by the provider. As JSO uses the implicit grant flow, there is now use for a client secret.
* `authorization`: REQUIRED The authorization URL endpoint of the OAuth server
* `redirect_uri`: OPTIONAL (may be needed by the provider). The URI that the user will be redirected back to when completed. This should be the same URL that the page is presented on.
* `default_lifetime` : Seconds with default lifetime of an access token. If set to `false`, it means permanent. Default is 3600. This only matters if expires_in was not sent from the server, which should ALWAYS be the case.
* `permanent_scope`: A scope that indicates that the lifetime of the access token is infinite. (not well-tested.)
* `scopes.require`: Control what scopes are required in the authorization request. This list if used when looking through cached tokens to see if we would like to use any of the existing.
* `scopes.request`: Control what scopes are requested in the authorization request. When none of the cached tokens will be used, and a new one will be request, the `scopes.request` list will be included in the authorization request.
* `response_type`: Default response_type for all authorization requests. Default: `token`. Can be overriden to in example use OpenID Connect


Options to `getToken(opts)`

* `allowia`: Set to false if user interaction is not allowed. Used for passive iframe loader.  If set to false a `prompt=none` paramter is added to the authorizatino request as specified in OpenID Connect.
* `allowredir`: Throw an exception if getToken would imply redirecting the user. Typically you would like to use checkToken() instead of using this.
* `response_type`: Override for this specific request.
* `scopes.require`: Override for this specific request.
* `scopes.request`: Override for this specific request.

Options to `checkToken(opts)`

* `scopes.require`: Override for this specific request.



### Catching the response when the user is returning


On the page (usually the same) that the user is sent back to after authorization, typically the `redirect_uri` endpoint, you would need to call the `callback`-function on JSO to tell it to check for response parameters:

```javascript
client.callback();
```
Be aware to run the `callback()` function early, and before you *router* and before you start using the jso object to fetch data.



### Getting the token

To get an token, use the `getToken` function:

```
client.getToken(opts)
    .then((token) => {
    	console.log("I got the token: ", token)
    })
```

You may also ensure that a token is available early in your application, to force all user interaction and redirection to happen before your application is fully loaded. To do that make a call to getToken, and wait for the callback before you continue.


### Logout

You may wipe all stored tokens, in order to simulate a *logout* experience:

```
client.wipeTokens();
```


## Using the examples

```
cd examples
python -m SimpleHTTPServer 8990
```

Then visit http://localhost:8990/




## Licence


UNINETT holds the copyright of the JSO library. The software can be used free of charge for both non-commercial and commercial projects.

The software is dual-licenced with *The GNU Lesser General Public License, version 2.1 (LGPL-2.1)* and *version 3.0*; meaning that you can select which of these two versions depending on your needs.

* <http://opensource.org/licenses/lgpl-2.1>
* <http://opensource.org/licenses/LGPL-3.0>




<!--

## Browser support

Version 3 of JSO makes use of ES6 Promises, which is not that well supported across browsers. The final release builds will include a polycfill that works with all browsers. More on that later...

JSO uses localStorage for caching tokens. localStorage is supported in Firefox 3.5+, Safari 4+, IE8+, and Chrome. For better compatibility use the localstorage library that is included in the example.

JSO uses JSON serialization functions (stringify and parse). These are supported in Firefox 3.5, Internet Explorer 8.0 and Chrome 3. For better compatibility use the JSON2.js library.

-->

## Library size

* 4.0.0-rc4: 12612 bytes


## More from Uninett

See also our javascript API mock-up tool <http://httpjs.net>.

* [Follow Andreas Åkre Solberg on twitter](https://twitter.com/erlang)
* [Read more about UNINETT](http://uninett.no)
* Contact address: <mailto:andreas.solberg@uninett.no>
