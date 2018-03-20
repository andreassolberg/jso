# JSO – OAuth 2.0 Client with Javascript

[![Build Status](https://travis-ci.org/andreassolberg/jso.svg?branch=master)](https://travis-ci.org/andreassolberg/jso)

* [JSO Documentation](http://oauth.no/jso/)

OAuth 2.0 from your javascript client web application or mobile application in a secure way. JSO is provided by [UNINETT AS](http://www.uninett.no), a non-profit company working for educational and research institutions in Norway.

See also our javascript API mock-up tool <http://httpjs.net>.

* [Follow Andreas Åkre Solberg on twitter](https://twitter.com/erlang)
* [Read more about UNINETT](http://uninett.no)
* Contact address: <mailto:andreas.solberg@uninett.no>


JSO may be used to make your web application (or mobile hybrid application) act as an OAuth 2.0 Consumer/client, and access remote APIs that are protected by OAuth 2.0 and supports CORS (or JSONP).

* [JSO Documentation](http://oauth.no/jso/)

## NOTICE: This is the preparations for the final version 3.0 of JSO


This is the third generation of JSO.

Main new features are:

* Build with heavily use of ES6 Promises
* Support for various loaders (hidden iframes, popup, passive, active)
* Adding support for doing authentication (OpenID Connect, and others)


[It is already available for testing](http://oauth.no/jso)



## Licence


UNINETT holds the copyright of the JSO library. The software can be used free of charge for both non-commercial and commercial projects.

The software is dual-licenced with *The GNU Lesser General Public License, version 2.1 (LGPL-2.1)* and *version 3.0*; meaning that you can select which of these two versions depending on your needs.

* <http://opensource.org/licenses/lgpl-2.1>
* <http://opensource.org/licenses/LGPL-3.0>


## Features

* Registered with [bower.io](http://bower.io)
* Implements **OAuth 2.0 Implicit Flow**.
* AMD-compatible loading.
* Supports the `Bearer` access token type.
* No server component needed.
* Adds an wrapper for to use `$.ajax()` as you're used to.
* Can handle multiple providers at once.
* Uses *HTML 5.0 localStorage* to cache Access Tokens. You do not need to implement a storage.
* Can prefetch all needed tokens with sufficient scopes, to start with, then tokens can be used for requests later. This way, you can be sure that you would not need to redirect anywhere in your business logic, because you would need to refresh an expired token.
* Excellent scope support.
* Caches and restores the hash, your application will not loose state when sending the user to the authorization endpoint.

## Dependencies

The builds in the `dist/` folder has all dependencies included.

When you run JSO from source, using AMD, you may re-use dependencies, which includes:

* jQuery
* ES6-Promise polyfill
* requirejs/almond


## Browser support

Version 3 of JSO makes use of ES6 Promises, which is not that well supported across browsers. The final release builds will include a polycfill that works with all browsers. More on that later...

JSO uses localStorage for caching tokens. localStorage is supported in Firefox 3.5+, Safari 4+, IE8+, and Chrome. For better compatibility use the localstorage library that is included in the example.

JSO uses JSON serialization functions (stringify and parse). These are supported in Firefox 3.5, Internet Explorer 8.0 and Chrome 3. For better compatibility use the JSON2.js library.
