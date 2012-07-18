# JSO - a Javascript OAuth Library

This library was written by Andreas Åkre Solberg (UNINETT AS) in March 2012.

* [Read the blog of Andreas Åkre Solberg](http://rnd.feide.no)
* [Follow Andreas Åkre Solberg on twitter](https://twitter.com/erlang)
* [Read more about UNINETT](http://uninett.no)
* Contact address: <mailto:andreas.solberg@uninett.no>

It's intended use is for web applications (javascript) that connects to one or more APIs using OAuth 2.0.

Current status is that the library is not well tested, due to lack of known providers with support for OAuth 2.0

Be aware of the cross-domain policy limitiations of browser. Check out CORS, JSONP, or consider proxying the requests from the browser through your own webserver.


## Licence

UNINETT holds the copyright of the JSO library. The software can be used free of charge for both non-commercial and commercial projects. The software is licenced with *The GNU Lesser General Public License, version 2.1 (LGPL-2.1)*.

* <http://www.opensource.org/licenses/lgpl-2.1>


## Features

* Implements OAuth 2.0 Implicit Flow. All you need is a single javascript file.
* Supports the `bearer` access token type.
* No server component needed.
* Adds a jQuery plugin extending the `$.ajax()` function with OAuth capabilities.
* Can handle multilple providers at once.
* Uses *HTML 5.0 localStorage* to cache Access Tokens. You do not need to implement a storage.
* Can prefetch all needed tokens with sufficient scopes, to start with, then tokens can be used for reqiests later. This way, you can be sure that you would not need to redirect anywhere in your business logic, because you would need to refresh an expired token.
* Excellent scope support. 
* Caches and restores the hash, your application will not loose state when sending the user to the authorization endpoint.

## Dependencies

JSO makes use of jQuery, mostly to plugin and make use of the `$.ajax()` function. If there is an interest for making JSO independent from jQuery, I can do that.

## Browser support

JSO uses localStorage for caching tokens. localStorage is supported in Firefox 3.5+, Safari 4+, IE8+, and Chrome. For better compatibility use the localstorage library that is included in the example.

JSO uses JSON serialization functions (stringify and parse). These are supported in Firefox 3.5, Internet Explorer 8.0 and Chrome 3. For better compatibility use the JSON2.js library that also is included in the example.


## Configure

First, you must configure your OAuth providers. You do that by calling `jso_configure` with a configuration object as a parameter.

The object is a key, value set of providers, where the providerID is an internal identifier of the provider that is used later, when doing protected calls.

In this example, we set the provider identifier to be `facebook`.

```javascript
	jso_configure({
		"facebook": {
			client_id: "xxxxxxxxxx",
			redirect_uri: "http://localhost/~andreas/jso/",
			authorization: "https://www.facebook.com/dialog/oauth",
			presenttoken: "qs"
		}
	});
```

* `client_id`: The client idenfier of your client that as trusted by the provider. As JSO uses the implicit grant flow, there is now use for a 
* `redirect_uri`: OPTIONAL (may be needed by the provider). The URI that the user will be redirected back to when completed. This shuold be the same URL that the page is presented on.
* `presenttoken`: OPTIONAL How to present the token with the protected calls. Values can be `qs` (in query string) or `header` (default; in authorization header).
* `default_lifetime` : OPTIONAL Seconds with default lifetime of an access token. If set to `false`, it means permanent.
* `permanent_scope`: A scope that indicates that the lifetime of the access token is infinite. (not yet tested.)
* `isDefault`: Some OAuth providers does not support the `state` parameter. When this parameter is missing, the consumer does not which provider that is sending the access_token. If you only provide one provider config, or set isDefault to `true` for one of them, the consumer will assume this is the provider that sent the token.
* `scope`: For providers that does not support `state`: If state was not provided, and default provider contains a scope parameter we assume this is the one requested... Set this as the same list of scopes that you provide to `ensure_tokens`.


The second optional parameter, options, of `jso_configure(providerconfig, options)` allows you to configure these global settings:

* `debug`: Default value is `false`. If you enable debugging, JSO will log a bunch of things to the console, using `console.log` - if not, JSO will not log anything.


## Authorization

This OPTIONAL step involves an early ensurance that all neccessary access tokens have been retreived. The reason why you would like to do this early, is that the authorization involves redirecting the user, and that might be tricky to do within your business logic.

So, by doing a call like this early in your code:

```javascript
	// Make sure that you have 
	jso_ensureTokens({
		"facebook": ["read_stream"],
		"google": ["https://www.googleapis.com/auth/userinfo.profile"]
	});
```

the library will check its cached tokens, and if it does not have the specified tokens/scopes, it will start a new authorization process.

When this code is completed, you know that you have valid tokens for your use cases.

The `jso_ensureTokens` function takes an object as input, with the providerids as keys, and the values are eigther `false` or an array of required scopes. A value of `false` mean that we do not care about scopes, but we want a valid token.


## OAuth protected data requests

To get data, you eigther use the `jso_getToken("facebook")` function, that returns a valid access token (or `null`), or you may use the `$.oajax()` function.

The `$.oajax()` function works very similar to `$.ajax()` ([see documentation](http://api.jquery.com/jQuery.ajax/)), actually the settings parameters are bypassed to the real `$.ajax()` function.

In addition to the settings properties allowed by `$.ajax()`, these properties are allowed:

* jso_provider: The providerid of the OAuth provider to use.
* jso_allowia: Allow userinteraction? If you have prepared the tokens, using `jso_ensureTokens()` you might set this value to `false` (default) and it will trow an exception instead of starting a new authorization process.
* jso_scopes: If this specific call requires one or more scopes, provide it here. It will be used to find a suitable token, if multiple exists.

Here is an example of retrieving the Facebook newsstream using OAuth:

```javascript
	$.oajax({
		url: "https://graph.facebook.com/me/home",
		jso_provider: "facebook",
		jso_scopes: ["read_stream"],
		jso_allowia: true,
		dataType: 'json',
		success: function(data) {
			console.log("Response (facebook):");
			console.log(data);
		}
	});
```

## jQuery or not jQuery

If you load jQuery before the JSO library, it will discover and add the `$.oajax` function. However, loading jQuery is optional, and if you do not load jQuery JSO will not complain, but neigther will if offer the easy to use `$.oajax` function.

If you do not use jQuery, you probably want to use the `jso_getToken(providerid, scopes)` function.

```javascript
	var accesstoken = jso_getToken("facebook", "read_stream");

	var authzheader = "Authorization: Authorization " + accesstoken;
	// Perform the Cross site AJAX request using this custom header with your
	// preferred AJAX library.
```



## Some convenient debugging functions

For debugging, open the javascript console. And you might type:


```javascript
	jso_dump();
```

to list all cached tokens, and 

```javascript
	jso_wipe();
```

to remove all tokens.







