# Getting started

This is a guide to get started using JSO. 

Please report to the [issue tracker]() if you discover errors in the documentation or the software.


If you want to use JSO together with Phonegap to support OAuth 2.0 in a hybrid web application, you may want to read the

* [JSO Phonegap Guide](README-Phonegap.md)




## Getting JSO

Preferrably you may obtain JSO using [bower.io](http://bower.io).

	bower install jso --save

Alternatively, you may obtain the source from github by downloading or cloning the source.

Currently, JSO is not available through any CDN.


## Loading JSO

Once you got JSO locally, you'll need to load the library in your web application.

	<script type="text/javascript" src="bower_components/jso/build/jso.js"></script>

If you use [requirejs](http://require.js), you may load the library like this:

```javascript
	define(function(require, exports, module) {

		var JSO = require("bower/jso/build/jso");

		...
	});
```

If you would like to fork the library, modify or contribute to development, you must use should use AMD loading, and refer to the `src/jso` version, like this:

```javascript
	var JSO = require("bower/jso/src/jso");
```


## Getting started

To start using JSO, you need to initialize a new JSO object with configuration for an OAuth 2.0 Provider:

```javascript
	var jso = new JSO({
		providerID: "google",
		client_id: "541950296471.apps.googleusercontent.com",
		redirect_uri: "http://bridge.uninett.no/jso/index.html",
		authorization: "https://accounts.google.com/o/oauth2/auth",
		scopes: { request: ["https://www.googleapis.com/auth/userinfo.profile"]}
	});
```

Here are more options to JSO:

* `providerID`: OPTIONAL This is just a name tag that is used to prefix data stored in the browser. It can be anything you'd like :)
* `client_id`: The client idenfier of your client that is trusted by the provider. As JSO uses the implicit grant flow, there is no use for a client secret.
* `redirect_uri`: OPTIONAL (may be needed by the provider). The URI that the user will be redirected back to when completed. This should be the same URL that the page is presented on.
* `presenttoken`: OPTIONAL How to present the token with the protected calls. Values can be `qs` (in query string) or `header` (default; in authorization header).
* `default_lifetime` : OPTIONAL Seconds with default lifetime of an access token. If set to `false`, it means permanent.
* `permanent_scope`: A scope that indicates that the lifetime of the access token is infinite. (not yet tested.)
* `isDefault`: Some OAuth providers does not support the `state` parameter. When this parameter is missing, the consumer does not which provider that is sending the access_token. If you only provide one provider config, or set isDefault to `true` for one of them, the consumer will assume this is the provider that sent the token.
* `scope`: For providers that does not support `state`: If state was not provided, and default provider contains a scope parameter we assume this is the one requested... Set this as the same list of scopes that you provide to `ensure_tokens`.
* `scopes.request`: Control what scopes are requested in the authorization request.
* `debug`: If debug is set to true, verbose logging will make it easier to debug problems with JSO.


## Catching the response when the user is returning


On the page (usually the same) that the user is sent back to after authorization, typically the `redirect_uri` endpoint, you would need to call the `callback`-function on JSO to tell it to check for response parameters:

```javascript
	jso.callback();
```


Be aware to run the `callback()` function early, and before you *router* and before you start using the jso object to fetch data.


## Configuration


The simplest way to get data, is to use the `.ajax()` function that wraps the jQuery `.ajax()` familiar to many. 

* [Documentation of jquery .ajax()](http://api.jquery.com/jquery.ajax/)

In order to use this wrapper, you need to point JSO to your jQuery object:

	JSO.enablejQuery($);

Note that you need to call this on the `JSO` object, and not on your `jso` instance.

Now, you may start fetching data:

```javascript
	jso.ajax({
		url: "https://www.googleapis.com/oauth2/v1/userinfo",
		oauth: {
			scopes: {
				request: ["https://www.googleapis.com/auth/userinfo.email"],
				require: ["https://www.googleapis.com/auth/userinfo.email"]
			}
		},
		dataType: 'json',
		success: function(data) {
			console.log("Response (google):");
			console.log(data);
			$(".loader-hideOnLoad").hide();
		}
	});
```

The `oauth` option property merges (and overrides) with the configuration of the `jso` object.



## Getting the token

You may avoid using jQuery, and handle the access token all by your self. To get an token, use the `getToken` function:


	jso.getToken(function(token) {

		console.log("I got the token: ", token);

	}, opts);

You may also ensure that a token is available early in your application, to force all user interaction and redirection to happen before your application is fully loaded. To do that make a call to getToken, and wait for the callback before you continue.


## Logout

You may wipe all stored tokens, in order to simulate a *logout* experience:

	jso.wipeTokens();













