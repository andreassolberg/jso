define(function(require, exports, module) {
	"use strict";

	var Class  = require('../class');
	var EventEmitter = require('../EventEmitter');
	var 
		JSO = require('bower/jso/src/jso'),
		$ = require('jquery');	

	var Authentication = Class.extend({


		"init": function(config) {

			var that = this;
			var defaults = {
				"providerId"	: "feideconnect",

				"client_id"		: "c148bc3f-6b15-47d7-ad23-3c36677eb8b5",
				"redirect_uri"	: "https://min.dev.feideconnect.no/index.dev.html",
				"redirect_uri_passive"	: "https://min.dev.feideconnect.no/passiveCallback.html",
				"redirect_uri_popup"	: "https://min.dev.feideconnect.no/popupCallback.html",

				"authorization"	: "https://auth.dev.feideconnect.no/oauth/authorization",
				"token"			: "https://auth.dev.feideconnect.no/oauth/token",
				"userInfo"		: "https://auth.dev.feideconnect.no/userinfo",

				// Legal values: "none", "passiveIFrame", "passive", "active"
				"onLoad": "passiveIFrame"
			};

			this._authenticated = null;
			this.user = null;

			this.config = $.extend({}, defaults, config);

			this.jso = new JSO(this.config);
			// this.jso.setLoader(JSO.IFramePassive);
			this.jso.setLoader(JSO.HTTPRedirect);

			console.log("JSO Loaded", this.config);
			
			this.jso.callback()
				.catch(function(err) {
					console.error("---- OAuth error detected ----");
					console.error(err);

					that.emit("error", err);
				});


			this.checkAuthenticationCached()
				.then(function(auth) {
					if (!auth && that.config.onLoad && that.config.onLoad !== "none") {

						switch(that.config.onLoad) {
							case "passiveIFrame":
								return that.checkAuthenticationPassiveIFrame();

							case "passive":
								return that.checkAuthenticationPassive();

							case "active":
								return that.authenticate();
						}

					}

				})
				.then(function() {
					that.emit("loaded");
					// console.error("LOADED LOADED LOADED LOADED LOADED LOADED LOADED ");

					if (!that.isAuthenticated()) {
						that.emit("stateChange", that._authenticated, that.user);
					}

				});


		},
		"getConfig": function() {
			return this.config;
		},
		"isAuthenticated": function() {
			return this._authenticated;
		},
		"onAuthenticated": function() {
			var that = this;
			return Promise.resolve().then(function() {
				if (that.isAuthenticated()) {
					return true;
				}
				return new Promise(function(resolve, reject) {
					that.on("stateChange", function(auth, user) {
						if (auth) {resolve();}
					});
				});
			});
		},

		"checkAuthenticationCached": function() {
			var that = this;
			return Promise.resolve().then(function() {


				// Check if this object is already authenticated..
				if (that.isAuthenticated()) {
					return true;
				}

				// Check if we have a cached OAuth token in document storage, then we 
				// will use that to reverify the userinfo endpoint.


				return that.checkUserInfo({
					"oauth": {
						"allowia": false,
						"allowredir": false
					}
				});

			});
		},

		"checkUserInfo": function(setOptions) {

			var that = this;
			var defaults = {
				"url": this.config.userInfo,
				"oauth": {
					"scopes": {
						"require": ["openid"]
					},
					"allowia": true,
					"allowredir": true
				}
			};
			var options = $.extend(true, {}, defaults, setOptions);

			this.authenticationInProgress = true;

			// console.error("Check userinfo with this config", options);

			return this.jso.request(options).then(function(res) {

				if  (res.audience !== that.config.client_id) {
					throw new Error('Wrong audience for this token.');
				}
				that.user = res.user;
				that._authenticated = true;
				that.emit("stateChange", that._authenticated, that.user);

				that.authenticationInProgress = false;
				return res;
			}).catch(function(err) {
				console.error("checkUserInfo failed", err);
				// return false;
			});

		},

		"getUser": function() {
			return this.user;
		},
		"authenticate": function() {
			return this.checkUserInfo();
		},
		"checkAuthenticationPassive": function() {
			return this.checkUserInfo({
				"oauth": {
					"allowia": false,
					"allowredir": true
				}
			});
		},
		"checkAuthenticationPassiveIFrame": function() {
			var that = this;
			return this.checkUserInfo({
				"oauth": {
					"allowia": false,
					"allowredir": true,
					"loader": JSO.IFramePassive,
					"redirect_uri": that.config.redirect_uri_passive
				}
			});
		},
		"authenticatePopup": function() {
			return this.checkUserInfo({
				"oauth": {
					"allowia": true,
					"allowredir": true,
					"loader": JSO.Popup,
					"redirect_uri": this.config.redirect_uri_popup
				}
			});
		},
		"dump": function() {
			return this.jso.dump();
		},
		"logout": function() {

			this.jso.wipeTokens();
			this.user = null;
			this._authenticated = false;
			this.emit("stateChange", this._authenticated, this.user);

		}

	}).extend(EventEmitter);


	return Authentication;

});