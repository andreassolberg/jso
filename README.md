# JSO – OAuth 2.0 Client with Javascript

[![Build Status](https://travis-ci.org/andreassolberg/jso.svg?branch=master)](https://travis-ci.org/andreassolberg/jso)

<!-- * [JSO Documentation](http://oauth.no/jso/) --->

JSO is a simple and flexible OAuth javascript library to use in your web application or native mobile app.

JSO is provided by [UNINETT AS](http://www.uninett.no), a non-profit company working for educational and research institutions in Norway.


## Features


* Implements **OAuth 2.0 Implicit Flow**.
* Can also be used with **OpenID Connect**.
* ES6 compatible loading via npm/webpack
* Also included a UMD-bundled version in the `dist/` folder
* No server component needed.
* Can handle multiple providers at once.
* Uses *HTML 5.0 localStorage* to cache Access Tokens. You do not need to implement a storage.
* Can prefetch all needed tokens with sufficient scopes, to start with, then tokens can be used for requests later. This way, you can be sure that you would not need to redirect anywhere in your business logic, because you would need to refresh an expired token.
* Excellent scope support.
* Caches and restores the hash, your application will not loose state when sending the user to the authorization endpoint.
* Provided with easy to use `fetch()` wrapper that takes care of all you need to get the token, and then returns the API data you want
* Experimental feature: *OAuth 2.0 Authorization Code* flow.
* Experimental feature: `Jquery.ajax()`-wrapper, if you have jquery loaded, and does not want to require or polyfill fetch



## How to use

Install using npm:

```bash
npm install jso --save
```

If you use webpack or similar it is recommended to import the needed components like this:

```javascript
import {JSO, Popup} from 'jso'

let config = {...}
let j = new JSO(config)
```

To load the javascript, you could use the distributed UMD module:

```html
<script type="text/javascript" src="dist/jso.js"></script>
<script type="text/javascript">
	var config = {...}
	var j = new jso.JSO(config)
</script>
```

The same bundle is available through CDN:

```html
<script type="text/javascript" src="https://unpkg.com/jso/dist/jso.js"></script>
```

### Initializing the client

To start using JSO, you need to initialize a new JSO object with configuration for an OAuth 2.0 Provider:

```javascript
let client = new JSO({
	providerID: "google",
	client_id: "541950296471.apps.googleusercontent.com",
	redirect_uri: "http://localhost:8080/", // The URL where you is redirected back, and where you perform run the callback() function.
	authorization: "https://accounts.google.com/o/oauth2/auth",
	scopes: { request: ["https://www.googleapis.com/auth/userinfo.profile"]}
})
```

Options to JSO constructor

* `providerID`: **OPTIONAL** This is just a name tag that is used to prefix data stored in the browser. It can be anything you'd like :)
* `client_id`: **REQUIRED** The client idenfier of your client that is trusted by the provider. As JSO uses the implicit grant flow, there is no use for a client secret.
* `authorization`: **REQUIRED** The authorization URL endpoint of the OAuth server
* `redirect_uri`: **OPTIONAL** (may be needed by the provider). The URI that the user will be redirected back to when completed. This should be the same URL that the page is presented on.
* `scopes.require`: Control what scopes are required in the authorization request. This list if used when looking through cached tokens to see if we would like to use any of the existing.
* `scopes.request`: Control what scopes are requested in the authorization request. When none of the cached tokens will be used, and a new one will be request, the `scopes.request` list will be included in the authorization request.
* `default_lifetime` : Seconds with default lifetime of an access token. If set to `false`, it means permanent. Default is 3600. This only matters if expires_in was not sent from the server, which should ALWAYS be the case.
* `permanent_scope`: A scope that indicates that the lifetime of the access token is infinite. (not well-tested.)
* `response_type`: Default response_type for all authorization requests. Default: `token`. Can be overriden to in example use OpenID Connect
* `debug`: Default set to `false`. Set this to `true` to enable debug logging to console.
* `request`: Optional additional request paramters added to the request. Useful for adding all the available OpenID Connect options


### Catching the response when the user is returning


On the page (usually the same) that the user is sent back to after authorization, typically the `redirect_uri` endpoint, you would need to call the `callback`-function on JSO to tell it to check for response parameters:

```javascript
client.callback()
```
Be aware to run the `callback()` function early, and before you *router* and before you start using the jso object to fetch data.



### Getting the token

To get an token, use the `getToken` function:

```javascript
client.getToken(opts)
    .then((token) => {
    	console.log("I got the token: ", token)
    })
```

You may also ensure that a token is available early in your application, to force all user interaction and redirection to happen before your application is fully loaded. To do that make a call to getToken, and wait for the callback before you continue.

REMEMBER to ALWAYS call the callback() function to process the response from the OAuth server, before you use getToken(), if not you will end up in an redirect_loop


Options to `getToken(opts)`

* `allowredir`: Throw an exception if getToken would imply redirecting the user. Typically you would like to use checkToken() instead of using this.
* `response_type`: Override for this specific request.
* `scopes.require`: Override for this specific request.
* `scopes.request`: Override for this specific request.


As an alternative to getToken(), you can check if the token is available with `checkToken()`.

```javascript
let token = client.getToken(opts)
if (token !== null) {
	console.log("I got the token: ", token)
}
```

Options to `checkToken(opts)`

* `scopes.require`: Override for this specific request.

### Logout

You may wipe all stored tokens, in order to simulate a *logout* experience:

```javascript
client.wipeTokens()
```


### Fetching data from a OAuth protected endpoint

JSO provides a simple wrapper around the [javascript Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API


```javascript

// Initialization
let config = {...}
let client = new JSO(config)
client.callback()

// When your application wants to access the protected data
let f = new Fetcher(client)
let url = 'https://some-api.httpjs.net/rest/me'
f.fetch(url, {})
	.then((data) => {
		return data.json()
	})
	.then((data) => {
		console.log("I got protected json data from the API", data)
	})
	.catch((err) => {
		console.error("Error from fetcher", err)
	})
```

If you would like to ensure that the required access token is obtained earlier than when you would like to access data, you may use `getToken()` for that, and you do not need to read or process the response.

```javascript
// Making sure the token is obtained.
// Will redirect the user for authentication if token is not available.
client.getToken({
	scopes: {
		request: ["profile", "restdata", "longterm", "email"]
		require: ["profile", "restdata", "longterm"]
	}
})
```


The `FetcherJQuery` is an alternative interface that uses `jQuery.ajax()` instead of `fetch()`. Consider the `FetcherJQuery` *beta*.

Notice that this class takes the jQuery object as a second argument to the constructor. The fetch options argument is provided as options to `jQuery.ajax()`.

The `fetch()` function returns a Promise that resolves the response data.

```javascript

// Initialization
let f = new FetcherJQuery(client, $)
let url = 'https://some-api.httpjs.net/rest/me'
f.fetch(url, {})
	.then((data) => {
		console.log("I got protected json data from the API", data)
	})
	.catch((err) => {
		console.error("Error from fetcher", err)
	})
```


## OAuth 2.0 Authorization Code flow

In the config include these parameters:

```
	response_type: 'code',
	client_secret: "xxxxx-xxxx-xxx-xxx", (if necessary)
	token: "https://auth.dataporten.no/oauth/token",
```

To resolve async issue after authorization, use `then()` method to return a Promise:

```
client.callback().then(callback => {
    let token = null;
    
    if (callback) {
      token = callback;
      console.log('I got the token', token);

    } else {
      client.getToken().then(tokenFromStore => {
        token = tokenFromStore;
        console.log('I got the token', token);
      });
    }
  });
```

You can use async function and the `await` keyword:
```
async function MyFunction() {
  let token = null;
  const callback = await client.callback();

  if (callback) {
    token = callback;
  } else {
    token = await client.getToken();
  }

  console.log('I got the token', token);
}
```

Also be aware that the implementation of this flow uses `fetch`, to support older browser you would need to polyfill that.





## Sending passive OpenID Connect authentication requests using hidden iFrames (Advanced)

If your OpenID Connect provider support passive requests and the enduser is already authenticated with single sign-on, you may obtain an authenticated state using a hidden iframe without redirecting the user at all.

First, you will need a separate redirect page, as the provided `example/passiveCallback.html`.

```javascript
let opts = {
	scopes: {
		request: ['email','longterm', 'openid', 'profile']
	},
	request: {
		prompt: "none"
	},
	response_type: 'id_token token',
	redirect_uri: "http://localhost:8001/passiveCallback.html"
}
client.setLoader(IFramePassive)
client.getToken(opts)
	.then((token) => {
		console.log("I got the token: ", token)
	})
	.catch((err) => {
		console.error("Error from passive loader", err)
	})
```


## Making authentication of end user in a popup, avoiding interruption of the state of your web application (Advanced)

If you would like to redirect the end user to login without loosing the state in your web app, you may use a popup window. This

First, you will need a separate redirect page, as the provided `example/popupCallback.html`.

```javascript
function authorizePopup() {
	let opts = {
		redirect_uri: "http://localhost:8001/popupCallback.html"
	}
	client.setLoader(Popup)
	client.getToken(opts)
		.then((token) => {
			console.log("I got the token: ", token)
		})
		.catch((err) => {
			console.error("Error from passive loader", err)
		})
}
$("#btnAuthenticate").on('click', (e) => {
	e.preventDefault()
	authorizePopup()
})
```

## Implementing a custom loader for use with in-app browser (Advanced)

Look at the `src/Loaders/*.js` files to see how loaders are implemented, and create a custom loader for your use case.

Contributions of loaders for Cordova in-app browser and similar are welcome.

Then use the `client.setLoader(Loader)` to use the custom loader. Out of the box, JSO comes with:

* HTTPRedirect - default usage
* Popup
* IFramePassive



## Using the examples

```bash
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

* 4.0.0:     12577 bytes
* 4.0.0-rc6: 12582 bytes
* 4.0.0-rc4: 12612 bytes


## More from Uninett

See also our javascript API mock-up tool <https://httpjs.net>, and our OAuth play tool <https://play.oauth.no>.

* [Follow Andreas Åkre Solberg on twitter](https://twitter.com/erlang)
* [Read more about UNINETT](http://uninett.no)
* Contact address: <mailto:andreas.solberg@uninett.no>
