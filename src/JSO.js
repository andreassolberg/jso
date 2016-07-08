/**
 * JSO - Javascript OAuth Library
 * 	Version 3.0
 *  UNINETT AS - http://uninett.no
 *  Author: Andreas Åkre Solberg <andreas.solberg@uninett.no>
 *  Licence: Simplified BSD Licence
 *
 *  Documentation available at: https://github.com/andreassolberg/jso
 */


var store = require('./store').store;
var utils = require('./utils').utils;


// import Store from './store';
// import Utils from './utils';

// import BasicLoader from './Loaders/BasicLoader';
// import HTTPRedirect from './Loaders/HTTPRedirect';
// import IFramePassive from './Loaders/IFramePassive';
// import Popup from './Loaders/Popup';

// import ExpiredTokenError from './errors/ExpiredTokenError';
// import HTTPError from './errors/HTTPError';
// import OAuthResponseError from './errors/OAuthResponseError';



import {EventEmitter} from 'eventemitter2';


// var _instance = null;
// // var bi = require('text!../etc/buildinfo.js');
// // var buildinfo = JSON.parse(bi);



var
 default_config = {
	 "lifetime": 3600,
	 "debug": true
 };

var JSO = class {
	constructor(config) {
		this.configure(config);
		this.providerID = this.getProviderID();

		this.Loader = HTTPRedirect;

		// JSO.instances[this.providerID] = this;

		this.callbacks = {};
	}

	configure(config) {
		this.config = new Config(default_config, config);
	}

	setLoader(loader) {
		if (typeof loader === "function") {
			this.Loader = loader;
		} else {
			throw new Error("loader MUST be an instance of the JSO BasicLoader");
		}
	}

	on(eventid, callback) {
		if (typeof eventid !== 'string') {throw new Error('Registering triggers on JSO must be identified with an event id');}
		if (typeof callback !== 'function') {throw new Error('Registering a callback on JSO must be a function.');}

		this.callbacks[eventid] = callback;
	}



	/**
	 * We need to get an identifier to represent this OAuth provider.
	 * The JSO construction option providerID is preferred, if not provided
	 * we construct a concatentaion of authorization url and client_id.
	 * @return {[type]} [description]
	 */
	getProviderID() {

		var c = this.config.get('providerID', null);
		if (c !== null) {return c;}

		var client_id = this.config.get('client_id', null, true);
		var authorization = this.config.get('authorization', null, true);

		return authorization + '|' + client_id;
	}

	/**
	 * If the callback has already successfully parsed a token response, call this.
	 * @return {[type]} [description]
	 */
	processTokenResponse(atoken) {

		var that = this;
		return new Promise(function(resolve, reject) {

			var state;
			var now = utils.epoch();

			if (atoken.state) {
				state = store.getState(atoken.state);
			} else {
				throw new Error("Could not get state from storage.");
			}

			if (!state) {
				throw new Error("Could not retrieve state");
			}
			if (!state.providerID) {
				throw new Error("Could not get providerid from state");
			}

			utils.log("Checking atoken ", atoken, "");

			/*
			 * Decide when this token should expire.
			 * Priority fallback:
			 * 1. Access token expires_in
			 * 2. Life time in config (may be false = permanent...)
			 * 3. Specific permanent scope.
			 * 4. Default library lifetime:
			 */
			if (atoken.expires_in) {
				atoken.expires = now + parseInt(atoken.expires_in, 10);
			} else if (that.config.get('default_lifetime', null) === false) {
				atoken.expires = null;
			} else if (that.config.has('permanent_scope')) {
				if (!store.hasScope(atoken, that.config.get('permanent_scope'))) {
					atoken.expires = null;
				}
			} else if (that.config.has('default_lifetime')) {
				atoken.expires = now + that.config.get('default_lifetime');
			} else {
				atoken.expires = now + 3600;
			}

			/*
			 * Handle scopes for this token
			 */
			if (atoken.scope) {
				atoken.scopes = atoken.scope.split(" ");
			} else if (state.scopes) {
				atoken.scopes = state.scopes;
			} else {
				atoken.scopes = [];
			}

			store.saveToken(state.providerID, atoken);

			if (state.restoreHash) {
				window.location.hash = state.restoreHash;
			} else {
				window.location.hash = '';
			}
			resolve(atoken);

		});
	}




	processErrorResponse(err) {

		var that = this;
		return new Promise(function(resolve, reject) {

			var state;
			if (err.state) {
				state = store.getState(err.state);
			} else {
				throw new Error("Could not get [state] and no default providerid is provided.");
			}

			if (!state) {
				throw new Error("Could not retrieve state");
			}
			if (!state.providerID) {
				throw new Error("Could not get providerid from state");
			}

			if (state.restoreHash) {
				window.location.hash = state.restoreHash;
			} else {
				window.location.hash = '';
			}
			reject(new JSO.OAuthResponseError(err));
		});

	}


	/**
	 * Check if the hash contains an access token.
	 * And if it do, extract the state, compare with
	 * config, and store the access token for later use.
	 *
	 * The url parameter is optional. Used with phonegap and
	 * childbrowser when the jso context is not receiving the response,
	 * instead the response is received on a child browser.
	 */
	callback(url) {

		var that = this;
		return Promise.resolve().then(function() {


			var response;
			var h = window.location.hash;

			utils.log("JSO.prototype.callback() " + url + "");

			// If a url is provided
			if (url) {
				// utils.log('Hah, I got the url and it ' + url);
				if(url.indexOf('#') === -1) {return;}
				h = url.substring(url.indexOf('#'));
				// utils.log('Hah, I got the hash and it is ' +  h);
			}

			/*
			 * Start with checking if there is a token in the hash
			 */
			if (h.length < 2) {return;}
			// if (h.indexOf("access_token") === -1) {return;}
			h = h.substring(1);
			response = utils.parseQueryString(h);

			if (response.hasOwnProperty("access_token")) {
				return that.processTokenResponse(response);

			} else if (response.hasOwnProperty("error")) {
				return that.processErrorResponse(response);
			}


		});
	}




	dump() {
		var tokens = store.getTokens(this.providerID);
		var x = {
			"providerID": this.providerID,
			"tokens": tokens,
			"config": this.config
		};
		return x;
	}

	_getRequestScopes(opts) {
		var scopes = [], i;
		/*
		 * Calculate which scopes to request, based upon provider config and request config.
		 */
		if (this.config.get('scopes') && this.config.get('scopes').request) {
			for(i = 0; i < this.config.get('scopes').request.length; i++) {scopes.push(this.config.get('scopes').request[i]);}
		}
		if (opts && opts.scopes && opts.scopes.request) {
			for(i = 0; i < opts.scopes.request.length; i++) {scopes.push(opts.scopes.request[i]);}
		}
		return utils.uniqueList(scopes);
	}

	_getRequiredScopes(opts) {
		var scopes = [], i;
		/*
		 * Calculate which scopes to request, based upon provider config and request config.
		 */
		if (this.config.get('scopes') && this.config.get('scopes').require) {
			for(i = 0; i < this.config.get('scopes').require.length; i++) {scopes.push(this.config.get('scopes').require[i]);}
		}
		if (opts && opts.scopes && opts.scopes.require) {
			for(i = 0; i < opts.scopes.require.length; i++) {scopes.push(opts.scopes.require[i]);}
		}
		return utils.uniqueList(scopes);
	}


	/**
	 * If getToken is called with allowia = false, and a token is not cached, it will return null.
	 * The scopes.required is used to pick from existing tokens.
	 *
	 * @param  {[type]} opts [description]
	 * @return {[type]}      [description]
	 */
	getToken(opts) {

		var that = this;



		return Promise.resolve().then(function() {

			var scopesRequire = that._getRequiredScopes(opts);
			var token = store.getToken(that.providerID, scopesRequire);

			return Promise.resolve().then(function() {

				if (token) {
					return token;

				} else {

					if (opts.hasOwnProperty("allowredir") && !opts.allowredir) {
						throw new Error("Cannot obtain a token, when not allowed to redirect...");

					} else {
						return that._authorize(opts);
					}

				}

			});


		});

	}

	checkToken(opts) {
		// var scopesRequest  = this._getRequestScopes(opts);

		var scopesRequire = this._getRequiredScopes(opts);
		return store.getToken(this.providerID, scopesRequire);
	}


	/**
	 * Send authorization request.
	 *
	 * @param  {[type]} opts These options matches the ones sent in the "oauth" property of the ajax settings in the request.
	 * @return {[type]}      [description]
	 */
	_authorize(opts) {
		var
			request,
			authurl,
			scopes;
		var that = this;

		return Promise.resolve().then(function() {

			var authorization = that.config.get('authorization', null, true);
			var client_id = that.config.get('client_id', null, true);

			utils.log("About to send an authorization request to this entry:", authorization);
			utils.log("Options", opts);

			request = {
				"response_type": "token",
				"state": utils.uuid()
			};
			if (opts.hasOwnProperty("allowia") && !opts.allowia) {
				request.prompt = "none";
			}

			// if (callback && typeof callback === 'function') {
				// utils.log("About to store a callback for later with state=" + request.state);
				// JSO.internalStates[request.state] = resolve;
			// }

			if (that.config.has('redirect_uri')) {
				request.redirect_uri = that.config.get('redirect_uri', '');
			}
			if (opts.redirect_uri) {
				request.redirect_uri = opts.redirect_uri;
			}

			request.client_id = client_id;


			/*
			 * Calculate which scopes to request, based upon provider config and request config.
			 */
			scopes = that._getRequestScopes(opts);
			if (scopes.length > 0) {
				request.scope = utils.scopeList(scopes);
			}

			utils.log("DEBUG REQUEST"); utils.log(request);

			authurl = utils.encodeURL(authorization, request);

			// We'd like to cache the hash for not loosing Application state.
			// With the implciit grant flow, the hash will be replaced with the access
			// token when we return after authorization.
			if (window.location.hash) {
				request.restoreHash = window.location.hash;
			}
			request.providerID = that.providerID;
			if (scopes) {
				request.scopes = scopes;
			}


			utils.log("Saving state [" + request.state + "]");
			utils.log(JSON.parse(JSON.stringify(request)));

			var loader = that.Loader;
			if (opts.hasOwnProperty("loader")) {
				loader = opts.loader;
			}

			console.log("Looking for loader", opts, loader);

			store.saveState(request.state, request);
			return that.gotoAuthorizeURL(authurl, loader)
				.then(function(url) {

					return that.callback(url);
				});


		});

	}

	gotoAuthorizeURL(url, Loader) {

		var that = this;
		var p = new Promise(function(resolve, reject) {
			if (Loader !== null && typeof Loader === 'function') {
				var loader = new Loader(url);
				if (!(loader instanceof BasicLoader)) {
					throw new Error("JSO selected Loader is not an instance of BasicLoader.");
				}
				resolve(loader.execute()
					.then(function(url) {
						return url;
					})
				);
			} else {
				reject(new Error('Cannot redirect to authorization endpoint because of missing redirect handler'));
			}
		});
		return p;

	}

	wipeTokens() {
		store.wipeTokens(this.providerID);
	}


	request(opts) {

		var that = this;
		var defaultAjaxConfig = {
			"dataType": 'json'
		};
		var ajaxConfig = $.extend(true, {}, defaultAjaxConfig, opts);

		return this.ajax(ajaxConfig)
			.catch(function(error) {


				if (error instanceof JSO.HTTPError) {


					var str = 'HTTP status (' + error.jqXHR.status + '), JSO error on [' + opts.url + '] ' + error.jqXHR.textStatus + '';
					error.message = str;
					error.httpError = str;

					if (error.jqXHR.hasOwnProperty("responseText") && typeof error.jqXHR.responseText === 'string') {
						try {
							var xmsg = JSON.parse(error.jqXHR.responseText);
							if (xmsg.hasOwnProperty("message")) {
								error.message = xmsg.message;
							}
							error.data = xmsg;

						} catch(err) {
							err.message = err.message + '. Unable to parse JSON response of this HTTP error.';
						}
					}
				}

				throw error;
			});

	}


	ajax(settings) {

		var that = this;
		var oauthOptions = settings.oauth || {};




		return this.getToken(oauthOptions)
			.then(function(token) {

				if (!token) {
					console.log("No token no fun");
					return;
				}

				if (token === null) {
					throw new Error("Cannot perform AJAX call without a token.");
				}
				utils.log("Ready. Got an token, and ready to perform an AJAX call", token);

				return new Promise(function(resolve, reject) {

					var allowia = oauthOptions.allowia || false;

					settings.error = function(jqXHR, textStatus, errorThrown) {
						utils.log('error(jqXHR, textStatus, errorThrown)');
						utils.log(jqXHR);
						utils.log(textStatus);
						utils.log(errorThrown);

						if (jqXHR.status === 401) {

							utils.log("Token expired. About to delete this token");
							that.wipeTokens();

							reject((new JSO.ExpiredTokenError({})).set("message", "Token was expired and is now deleted. Try again."));
						}
						var httpError = new JSO.HTTPError({})
							.set("jqXHR", jqXHR)
							.set("textStatus", textStatus)
							.set("errorThrown", errorThrown);
						reject(httpError);

					};

					settings.success = function(data) {
						resolve(data);
					};

					if (that.config.get('presenttoken', null) === 'qs') {
						if (!settings.data) {
							settings.data = {};
						}
						settings.data.access_token = token.access_token;

					} else {
						if (!settings.headers) {settings.headers = {};}
						settings.headers.Authorization = "Bearer " + token.access_token;
					}
					utils.log('$.ajax settings', settings);

					JSO.$.ajax(settings);

				});




		});




	}












	inappbrowser(params) {
		var that = this;
		params = params || {};
		return function(url, callback) {


	        var onNewURLinspector = function(ref) {
	        	return function(inAppBrowserEvent) {

		            //  we'll check the URL for oauth fragments...
		            var url = inAppBrowserEvent.url;
		            utils.log("loadstop event triggered, and the url is now " + url);

		            if (that.URLcontainsToken(url)) {
		                // ref.removeEventListener('loadstop', onNewURLinspector);
		                setTimeout(function() {
		                	ref.close();
		                }, 500);


			            that.callback(url, function() {
			                // When we've found OAuth credentials, we close the inappbrowser...
			                utils.log("Closing window ", ref);
			                if (typeof callback === 'function') { callback(); }
			            });
		            }

		        };
		    };

			var target = '_blank';
			if (params.hasOwnProperty('target')) {
				target = params.target;
			}
			var options = {};

			utils.log("About to open url " + url);

			var ref = window.open(url, target, options);
			utils.log("URL Loaded... ");
	        ref.addEventListener('loadstart', onNewURLinspector(ref));
	        utils.log("Event listeren ardded... ", ref);


	        // Everytime the Phonegap InAppBrowsers moves to a new URL,



		};
	}



	/**
	 * Do some sanity checking whether an URL contains a access_token in an hash fragment.
	 * Used in URL change event trackers, to detect responses from the provider.
	 * @param {[type]} url [description]
	 */
	URLcontainsToken(url) {
		// If a url is provided
		var h;
		if (url) {
			// utils.log('Hah, I got the url and it ' + url);
			if(url.indexOf('#') === -1) { return false;}
			h = url.substring(url.indexOf('#'));
			// utils.log('Hah, I got the hash and it is ' +  h);
		}

		/*
		 * Start with checking if there is a token in the hash
		 */
		if (h.length < 2){ return false;}
		if (h.indexOf("access_token") === -1) {return false;}
		return true;
	}

}









// JSO.internalStates = [];
JSO.instances = {};
JSO.store = store;
JSO.utils = utils;


JSO.enablejQuery = function($) {
	JSO.$ = $;
};

JSO.OAuthResponseError = class {
  constructor(props) {
    for(var key in props) {
			this[key] = props[key];
		}
  }
}


JSO.ExpiredTokenError = class {
  constructor(props) {
    for(var key in props) {
			this[key] = props[key];
		}
  }
}


JSO.HTTPError = class {
  constructor(props) {
    for(var key in props) {
			this[key] = props[key];
		}
  }
}

JSO.info = function() {
	return buildinfo;
};


Object.assign(JSO.prototype, new EventEmitter({}));

_instance = new JSO();


exports.JSO = _instance
exports.Popup = Popup
exports.IFramePassive = IFramePassive
exports.HTTPRedirect = HTTPRedirect
exports.BasicLoader = BasicLoader
