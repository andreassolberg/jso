define(function(require, exports, module) {
	"use strict";

	var Class  = require('../class');

	var BasicLoader = Class.extend({
		"init": function(url) {
			console.log("Initializing a loader with url " + url);
			this.url = url;
		},
		"execute": function() {

		}
	});


	return BasicLoader;

});