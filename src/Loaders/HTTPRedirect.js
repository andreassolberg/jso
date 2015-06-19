define(function(require, exports, module) {
	"use strict";

	
	var Class  = require('../class');
	// var $ = require('jquery');
	var BasicLoader = require('./BasicLoader');


	var HTTPRedirect = BasicLoader.extend({
		"execute": function() {
			var that = this;
			return new Promise(function(resolve, reject) {
				window.location = that.url;
				resolve();
			});
		}
	});

	return HTTPRedirect;

});