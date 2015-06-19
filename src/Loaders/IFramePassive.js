//define(['utils'], function(utils) {

define(function(require, exports, module) {
	"use strict";

	var utils = require('../utils');
	var Class  = require('../class');
	var $ = require('jquery');
	var BasicLoader = require('./BasicLoader');


	// var messenger = {};
	// messenger.send = function(msg) {
	// 	if (messenger.receiver) {
	// 		messenger.receiver(msg);
	// 	} else {
	// 		console.error("Could not deliver message from iframe, because listener was not setup.");
	// 	}
	// };


	var IFramePassive = BasicLoader.extend({
		
		"init": function(url) {
			var that = this;

			this.timeout = 5000;
			this.callback = null;
			this.isCompleted = false;

			this.iframe = $('<iframe class="jso_messenger_iframe" style="display: none;" src="' + url + '"></iframe>')
				.on('load', function() {
					try {
						var url = this.contentWindow.window.location.href;
						that._completed(url);
						
					} catch(err) {
						// console.error("Security exception", err);
					}

				});

			this._super(url);

		},

		"_cleanup": function() {
			this.iframe.remove();
		},

		"_completed": function(url) {
			var that = this;
			if (!that.isCompleted) {
				if (that.callback && typeof that.callback === 'function') {
					that.callback(url);
				}
				this.isCompleted = true;
				this._cleanup();
			}
		},

		"execute": function() {
			var that = this;
			var p = new Promise(function(resolve, reject) {
				that.callback = resolve;
				$("body").prepend(that.iframe);
				setTimeout(function() {
					if (!that.isCompleted) {
						that.isCompleted = true;
						that._cleanup();
						reject(new Error("Loading iframe timed out"));	
					}
				}, that.timeout);
			});
			return p;
		},
	});



	return IFramePassive;

});


