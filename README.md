# JSO - a Javascript OAuth Library

The initial version 1 of this library was written by Andreas Åkre Solberg (UNINETT AS) in March 2012. **This is the beta release of JSO2, and redesigned and not well-tested version of the same library.**  [Return to the stable version 1 of JSO](https://github.com/andreassolberg/jso)


* [Read the blog of Andreas Åkre Solberg](http://rnd.feide.no)
* [Follow Andreas Åkre Solberg on twitter](https://twitter.com/erlang)
* [Read more about UNINETT](http://uninett.no)
* Contact address: <mailto:andreas.solberg@uninett.no>

It's intended use is for web applications (javascript) that connects to one or more APIs using OAuth 2.0.

Current status is that the library is not well tested, due to lack of known providers with support for OAuth 2.0

Be aware of the cross-domain policy limitiations of browser. Check out CORS, JSONP, or consider proxying the requests from the browser through your own webserver.

If you want to use JSO together with Phonegap to support OAuth 2.0 in a hybrid web application, you may want to read the

* [JSO Phonegap Guide](README-Phonegap.md)

## Contributors

* [Robbie MacKay](https://github.com/rjmackay)


## Licence

UNINETT holds the copyright of the JSO library. The software can be used free of charge for both non-commercial and commercial projects. The software is licenced with *Simplified BSD License*.

* <http://opensource.org/licenses/BSD-2-Clause>


## Features

* Implements OAuth 2.0 Implicit Flow. 
* AMD Loading
* Supports the `Bearer` access token type.
* No server component needed.
* Adds a jQuery plugin extending the `$.ajax()` function with OAuth capabilities.
* Can handle multilple providers at once.
* Uses *HTML 5.0 localStorage* to cache Access Tokens. You do not need to implement a storage.
* Can prefetch all needed tokens with sufficient scopes, to start with, then tokens can be used for reqiests later. This way, you can be sure that you would not need to redirect anywhere in your business logic, because you would need to refresh an expired token.
* Excellent scope support. 
* Caches and restores the hash, your application will not loose state when sending the user to the authorization endpoint.

## Dependencies

JSO may make use of jQuery, mostly to plugin and make use of the `ajax()` function.


## Browser support

JSO uses localStorage for caching tokens. localStorage is supported in Firefox 3.5+, Safari 4+, IE8+, and Chrome. For better compatibility use the localstorage library that is included in the example.

JSO uses JSON serialization functions (stringify and parse). These are supported in Firefox 3.5, Internet Explorer 8.0 and Chrome 3. For better compatibility use the JSON2.js library that also is included in the example.


## Configure


First, load JSO with requirejs:

```javascript
	var 
		OAuth = require('../jso/jso2'),
		jQuery = require('jquery');
	OAuth.enablejQuery($);
```

Loading jQuery is optional. If you load jQuery and want the `ajax()` function, you should run the enablejQuery function.

Next is configuring an OAuth object with the configuration of an OAuth Provider.

```javascript
	var o = new OAuth('google', {
		client_id: "541950296471.apps.googleusercontent.com",
		redirect_uri: "http://bridge.uninett.no/jso/index.html",
		authorization: "https://accounts.google.com/o/oauth2/auth",
		scopes: { request: ["https://www.googleapis.com/auth/userinfo.profile"]}
	});
```

Here is some of the parameters:


* `client_id`: The client idenfier of your client that as trusted by the provider. As JSO uses the implicit grant flow, there is now use for a 
* `redirect_uri`: OPTIONAL (may be needed by the provider). The URI that the user will be redirected back to when completed. This shuold be the same URL that the page is presented on.
* `presenttoken`: OPTIONAL How to present the token with the protected calls. Values can be `qs` (in query string) or `header` (default; in authorization header).
* `default_lifetime` : OPTIONAL Seconds with default lifetime of an access token. If set to `false`, it means permanent.
* `permanent_scope`: A scope that indicates that the lifetime of the access token is infinite. (not yet tested.)
* `isDefault`: Some OAuth providers does not support the `state` parameter. When this parameter is missing, the consumer does not which provider that is sending the access_token. If you only provide one provider config, or set isDefault to `true` for one of them, the consumer will assume this is the provider that sent the token.
* `scope`: For providers that does not support `state`: If state was not provided, and default provider contains a scope parameter we assume this is the one requested... Set this as the same list of scopes that you provide to `ensure_tokens`.
* `scopes.request`: Control what scopes are requested in the authorization request.



## Callback

At the endpoint where the OAuth provider is redirecting back the user with the access token response, you need to run the callback(). This allows JSO to collect and parse the response.

```javascript
	o.callback();
```

Be aware to run the `callback()` function before your *router*, and before `o.getToken()` or `o.ajax()`.

The redirect_uri may very well be the same page that initates the authorization request.


## OAuth protected data requests


You may use the `o.ajax()` function to perform OAuth protected API calls. 

```javascript
	o.ajax({
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

`o.ajax()` wraps the `$.ajax()` function with one single additional optional option property `oauth`.

Currently, only the `scopes` property is included. It adds to the scopes property in the initial provider configuration.




