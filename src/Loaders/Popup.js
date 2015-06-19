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


	var Popup = BasicLoader.extend({
		
		"init": function(url) {
			var that = this;
			// this.callback = null;
			// this.isCompleted = false;

			this._super(url);

		},

		"execute": function() {
			var that = this;

			console.error("Popup loaded...");


			/*
			* In the popup's scripts, running on <http://example.org>:
			*/

			


			var p = new Promise(function(resolve, reject) {

				window.addEventListener("message", function(event) {
					console.log("Sent a message to event.origin " + event.origin + " and got the following in response:");
					console.log("<em>" + event.data + "</em>");

			    	var url = newwindow.location.href;
			    	console.error("Popup location is ", url, newwindow.location);
			        resolve(url);

				});


				
				window.popupCompleted = function() {
			    	var url = newwindow.location.href;
			    	console.error("Popup location is ", url, newwindow.location);
			        resolve(url);
				};

				var newwindow = window.open(that.url, 'uwap-auth', 'height=600,width=800');
				if (window.focus) {
					newwindow.focus();
				}

				// newwindow.onunload = function() {
			 //    	var url = newwindow.location.href;
			 //    	console.error("Popup location is ", url, newwindow.location);
			 //        resolve(url);
				// }
					
				// newwindow.onbeforeunload = function(){ 

			 //    	// var url = newwindow.location.href;
			 //    	// console.error("Popup location is ", url, newwindow.location);
			 //     //    resolve(url);

				// }


			});
			return p;
		}

	});



	return Popup;

});


