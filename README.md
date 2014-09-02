# JSO – OAuth 2.0 Client with Javascript


* [Documentation: Getting Started](README-getting-started.md)


OAuth 2.0 from your javascript client web applicaiton or mobile application in a secure way. JSO is provided by [UNINETT AS](http://www.uninett.no), a non-profit company working for educational and research institutions in Norway.

See also our javascript API mock-up tool <http://httpjs.net>.

* [Read the blog of Andreas Åkre Solberg](http://rnd.feide.no)
* [Follow Andreas Åkre Solberg on twitter](https://twitter.com/erlang)
* [Read more about UNINETT](http://uninett.no)
* Contact address: <mailto:andreas.solberg@uninett.no>


JSO may be used to make your web application (or mobile hybrid application) act as an OAuth 2.0 Consumer/client, and access remote APIs that are protected by OAuth 2.0 and supports CORS (or JSONP). 



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
* Can handle multilple providers at once.
* Uses *HTML 5.0 localStorage* to cache Access Tokens. You do not need to implement a storage.
* Can prefetch all needed tokens with sufficient scopes, to start with, then tokens can be used for reqiests later. This way, you can be sure that you would not need to redirect anywhere in your business logic, because you would need to refresh an expired token.
* Excellent scope support. 
* Caches and restores the hash, your application will not loose state when sending the user to the authorization endpoint.

## Dependencies

No external dependencies. Plays well with jQuery though.


## Browser support

JSO uses localStorage for caching tokens. localStorage is supported in Firefox 3.5+, Safari 4+, IE8+, and Chrome. For better compatibility use the localstorage library that is included in the example.

JSO uses JSON serialization functions (stringify and parse). These are supported in Firefox 3.5, Internet Explorer 8.0 and Chrome 3. For better compatibility use the JSON2.js library that also is included in the example.




