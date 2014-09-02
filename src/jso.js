/**
 * JSO - Javascript JSO Library
 * 		Version 2.0
 *   	UNINETT AS - http://uninett.no
 *   	
 * Documentation available at: https://github.com/andreassolberg/jso
 */

define(function(require, exports, module) {

	var 
		default_config = {
			"lifetime": 3600,
			"debug": true,
			"foo": {
				"bar": "lsdkjf"
			}
		};

	var store = require('./store');
	var utils = require('./utils');
	var Config = require('./Config');

	var JSO = function(config) {

		this.config = new Config(default_config, config);
		this.providerID = this.getProviderID();

		JSO.instances[this.providerID] = this;

		// console.log("Testing configuration object");
		// console.log("foo.bar.baz (2,false)", this.config.get('foo.bar.baz', 2 ) );
		// console.log("foo.bar.baz (2,true )", this.config.get('foo.bar.baz', 2, true ) );
	};


	/**
	 * We need to get an identifier to represent this OAuth provider.
	 * The JSO construction option providerID is preferred, if not provided
	 * we construct a concatentaion of authorization url and client_id.
	 * @return {[type]} [description]
	 */
	JSO.prototype.getProviderID = function() {

		var c = this.config.get('providerID', null);
		if (c !== null) return c;

		var client_id = this.config.get('client_id', null, true);
		var authorization = this.config.get('authorization', null, true);

		return authorization + '|' + client_id;
	};


	JSO.internalStates = [];
	JSO.instances = {};
	JSO.store = store;

	JSO.enablejQuery = function($) {
		JSO.$ = $;
	};


	/**
	 * Check if the hash contains an access token. 
	 * And if it do, extract the state, compare with
	 * config, and store the access token for later use.
	 *
	 * The url parameter is optional. Used with phonegap and
	 * childbrowser when the jso context is not receiving the response,
	 * instead the response is received on a child browser.
	 */
	JSO.prototype.callback = function(url, callback, providerID) {
		var 
			atoken,
			h = window.location.hash,
			now = utils.epoch(),
			state,
			instance;

		utils.log("JSO.prototype.callback()");

		// If a url is provided 
		if (url) {
			// utils.log('Hah, I got the url and it ' + url);
			if(url.indexOf('#') === -1) return;
			h = url.substring(url.indexOf('#'));
			// utils.log('Hah, I got the hash and it is ' +  h);
		}

		/*
		 * Start with checking if there is a token in the hash
		 */
		if (h.length < 2) return;
		if (h.indexOf("access_token") === -1) return;
		h = h.substring(1);
		atoken = utils.parseQueryString(h);

		if (atoken.state) {
			state = store.getState(atoken.state);
		} else {
			if (!providerID) {throw "Could not get [state] and no default providerid is provided.";}
			state = {providerID: providerID};
		}

		
		if (!state) throw "Could not retrieve state";
		if (!state.providerID) throw "Could not get providerid from state";
		if (!JSO.instances[state.providerID]) throw "Could not retrieve JSO.instances for this provider.";
		
		instance = JSO.instances[state.providerID];

		/**
		 * If state was not provided, and default provider contains a scope parameter
		 * we assume this is the one requested...
		 */
		if (!atoken.state && co.scope) {
			state.scopes = instance._getRequestScopes();
			utils.log("Setting state: ", state);
		}
		utils.log("Checking atoken ", atoken, " and instance ", instance);

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
		} else if (instance.config.get('default_lifetime', null) === false) {
			// Token is permanent.
		} else if (instance.config.has('permanent_scope')) {
			if (!store.hasScope(atoken, instance.config.get('permanent_scope'))) {
				atoken.expires = now + 3600*24*365*5;
			}
		} else if (instance.config.has('default_lifetime')) {
			atoken.expires = now + instance.config.get('default_lifetime');
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
		}



		store.saveToken(state.providerID, atoken);

		if (state.restoreHash) {
			window.location.hash = state.restoreHash;
		} else {
			window.location.hash = '';
		}


		utils.log(atoken);

		if (JSO.internalStates[atoken.state] && typeof JSO.internalStates[atoken.state] === 'function') {
			// log("InternalState is set, calling it now!");
			JSO.internalStates[atoken.state]();
			delete JSO.internalStates[atoken.state];
		}


		if (typeof callback === 'function') {
			callback();
		}

		// utils.log(atoken);

	};

	JSO.prototype._getRequestScopes = function(opts) {
		var scopes = [], i;
		/*
		 * Calculate which scopes to request, based upon provider config and request config.
		 */
		if (this.config.scopes && this.config.scopes.request) {
			for(i = 0; i < this.config.scopes.request.length; i++) scopes.push(this.config.scopes.request[i]);
		}
		if (opts && opts.scopes && opts.scopes.request) {
			for(i = 0; i < opts.scopes.request.length; i++) scopes.push(opts.scopes.request[i]);
		}
		return utils.uniqueList(scopes);
	};

	JSO.prototype._getRequiredScopes = function(opts) {
		var scopes = [], i;
		/*
		 * Calculate which scopes to request, based upon provider config and request config.
		 */
		if (this.config.scopes && this.config.scopes.require) {
			for(i = 0; i < this.config.scopes.require.length; i++) scopes.push(this.config.scopes.require[i]);
		}
		if (opts && opts.scopes && opts.scopes.require) {
			for(i = 0; i < opts.scopes.require.length; i++) scopes.push(opts.scopes.require[i]);
		}
		return utils.uniqueList(scopes);
	};

	JSO.prototype.getToken = function(callback, opts) {
		// var scopesRequest  = this._getRequestScopes(opts);
		
		var scopesRequire = this._getRequiredScopes(opts);
		var token = store.getToken(this.providerID, scopesRequire);

		if (token) {
			return callback(token);
		} else {
			this._authorize(callback, opts);
		}

	};

	JSO.prototype._authorize = function(callback, opts) {
		var 
			request,
			authurl,
			scopes;

		var authorization = this.config.get('authorization', null, true);
		var client_id = this.config.get('client_id', null, true);

		utils.log("About to send an authorization request to this entry:", authorization);
		console.log("Options", opts);


		request = {
			"response_type": "token",
			"state": utils.uuid()
		};

		if (callback && typeof callback === 'function') {
			JSO.internalStates[request.state] = callback;
		}

		if (this.config.has('redirect_uri')) {
			request.redirect_uri = this.config.get('redirect_uri', '');
		}

		request.client_id = client_id;



		/*
		 * Calculate which scopes to request, based upon provider config and request config.
		 */
		scopes = this._getRequestScopes(opts);
		if (scopes.length > 0) {
			request.scope = utils.scopeList(scopes);
		}

		console.log("DEBUG REQUEST"); console.log(request);

		authurl = utils.encodeURL(authorization, request);

		// We'd like to cache the hash for not loosing Application state. 
		// With the implciit grant flow, the hash will be replaced with the access
		// token when we return after authorization.
		if (window.location.hash) {
			request.restoreHash = window.location.hash;
		}
		request.providerID = this.providerID;
		if (scopes) {
			request.scopes = scopes;
		}


		utils.log("Saving state [" + request.state + "]");
		utils.log(JSON.parse(JSON.stringify(request)));

		store.saveState(request.state, request);
		this.gotoAuthorizeURL(authurl);
	};


	JSO.prototype.gotoAuthorizeURL = function(url, callback) {

		prompt('Authorization url', url);
	
		setTimeout(function() {
			window.location = url;
		}, 2000);		

	};

	JSO.prototype.wipeTokens = function() {
		store.wipeTokens(this.providerID);
	};


	JSO.prototype.ajax = function(settings) {

		var 
			allowia,
			scopes,
			token,
			providerid,
			co;

		var that = this;

		if (!JSO.hasOwnProperty('$')) throw new Error("JQuery support not enabled.");
		
		oauthOptions = settings.oauth || {};

		var errorOverridden = settings.error || null;
		settings.error = function(jqXHR, textStatus, errorThrown) {
			utils.log('error(jqXHR, textStatus, errorThrown)');
			utils.log(jqXHR);
			utils.log(textStatus);
			utils.log(errorThrown);

			if (jqXHR.status === 401) {

				utils.log("Token expired. About to delete this token");
				utils.log(token);
				that.wipeTokens();

			}
			if (errorOverridden && typeof errorOverridden === 'function') {
				errorOverridden(jqXHR, textStatus, errorThrown);
			}
		};


		return this.getToken(function(token) {
			utils.log("Ready. Got an token, and ready to perform an AJAX call", token);

			if (that.config.get('presenttoken', null) === 'qs') {
				// settings.url += ((h.indexOf("?") === -1) ? '?' : '&') + "access_token=" + encodeURIComponent(token["access_token"]);
				if (!settings.data) settings.data = {};
				settings.data.access_token = token.access_token;
			} else {
				if (!settings.headers) settings.headers = {};
				settings.headers.Authorization = "Bearer " + token.access_token;
			}
			utils.log('$.ajax settings', settings);
			return JSO.$.ajax(settings);

		}, oauthOptions);
		
	};





	/* 
	 * Redirects the user to a specific URL
	 */
	// api_redirect = function(url) {
	// 	setTimeout(function() {
	// 		window.location = url;
	// 	}, 2000);
	// };










	// exp.jso_ensureTokens = function (ensure) {
	// 	var providerid, scopes, token;
	// 	for(providerid in ensure) {
	// 		scopes = undefined;
	// 		if (ensure[providerid]) scopes = ensure[providerid];
	// 		token = store.getToken(providerid, scopes);

	// 		utils.log("Ensure token for provider [" + providerid + "] ");
	// 		utils.log(token);

	// 		if (token === null) {
	// 			jso_authrequest(providerid, scopes);
	// 		}
	// 	}


	// 	return true;
	// }


	// exp.jso_configure = function(c, opts) {
	// 	config = c;
	// 	setOptions(opts);
	// 	try {

	// 		var def = exp.jso_findDefaultEntry(c);
	// 		utils.log("jso_configure() about to check for token for this entry", def);
	// 		exp.jso_checkfortoken(def);	

	// 	} catch(e) {
	// 		utils.log("Error when retrieving token from hash: " + e, c, opts);
	// 		window.location.hash = "";
	// 	}
		
	// }

	// exp.jso_dump = function() {
	// 	var key;
	// 	for(key in config) {

	// 		utils.log("=====> Processing provider [" + key + "]");
	// 		utils.log("=] Config");
	// 		utils.log(config[key]);
	// 		utils.log("=] Tokens")
	// 		utils.log(store.getTokens(key));

	// 	}
	// }

	// exp.jso_wipe = function() {
	// 	var key;
	// 	utils.log("jso_wipe()");
	// 	for(key in config) {
	// 		utils.log("Wipping tokens for " + key);
	// 		store.wipeTokens(key);
	// 	}
	// }

	// exp.jso_getToken = function(providerid, scopes) {
	// 	var token = store.getToken(providerid, scopes);
	// 	if (!token) return null;
	// 	if (!token["access_token"]) return null;
	// 	return token["access_token"];
	// }










	// /*
	//  * From now on, we only perform tasks that require jQuery.
	//  * Like adding the $.oajax function.
	//  */
	// if (typeof $ === 'undefined') return;

	// $.oajax = function(settings) {
	// 	var 
	// 		allowia,
	// 		scopes,
	// 		token,
	// 		providerid,
	// 		co;
		
	// 	providerid = settings.jso_provider;
	// 	allowia = settings.jso_allowia || false;
	// 	scopes = settings.jso_scopes;
	// 	token = api_storage.getToken(providerid, scopes);
	// 	co = config[providerid];

	// 	// var successOverridden = settings.success;
	// 	// settings.success = function(response) {
	// 	// }

	// 	var errorOverridden = settings.error || null;

	// 	var performAjax = function() {
	// 		// utils.log("Perform ajax!");

	// 		if (!token) throw "Could not perform AJAX call because no valid tokens was found.";	

	// 		if (co["presenttoken"] && co["presenttoken"] === "qs") {
	// 			// settings.url += ((h.indexOf("?") === -1) ? '?' : '&') + "access_token=" + encodeURIComponent(token["access_token"]);
	// 			if (!settings.data) settings.data = {};
	// 			settings.data["access_token"] = token["access_token"];
	// 		} else {
	// 			if (!settings.headers) settings.headers = {};
	// 			settings.headers["Authorization"] = "Bearer " + token["access_token"];
	// 		}
	// 		$.ajax(settings);
	// 	};

	// 	settings.error = function(jqXHR, textStatus, errorThrown) {
	// 		utils.log('error(jqXHR, textStatus, errorThrown)');
	// 		utils.log(jqXHR);
	// 		utils.log(textStatus);
	// 		utils.log(errorThrown);

	// 		if (jqXHR.status === 401) {

	// 			utils.log("Token expired. About to delete this token");
	// 			utils.log(token);
	// 			api_storage.wipeTokens(providerid);

	// 		}
	// 		if (errorOverridden && typeof errorOverridden === 'function') {
	// 			errorOverridden(jqXHR, textStatus, errorThrown);
	// 		}
	// 	}


	// 	if (!token) {
	// 		if (allowia) {
	// 			utils.log("Perform authrequest");
	// 			jso_authrequest(providerid, scopes, function() {
	// 				token = api_storage.getToken(providerid, scopes);
	// 				performAjax();
	// 			});
	// 			return;
	// 		} else {
	// 			throw "Could not perform AJAX call because no valid tokens was found.";	
	// 		}
	// 	}


	// 	performAjax();
	// };

	return JSO;


});