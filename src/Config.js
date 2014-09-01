define(function() {
	// Credits to Ryan Lynch
	// http://stackoverflow.com/questions/11197247/javascript-equivalent-of-jquerys-extend-method
	var extend = function (a){
		for(var i=1; i<a.length; i++)
			for(var key in a[i])
				if(a[i].hasOwnProperty(key))
					a[0][key] = a[i][key];
		return a[0];
	};


	var Config = function() {
		var ca = [{}];
		for(var i = 0; i < arguments.length; i++) {
			ca.push(arguments[i]);
		}
		this.config = extend(ca);
	};

	Config.prototype.has = function(key) {
		var pointer = this.config;
		var splittedKeys = key.split('.');
		var i = 0;

		for(i = 0; i < splittedKeys.length; i++) {
			if (pointer.hasOwnProperty(splittedKeys[i])) {
				pointer = pointer[splittedKeys[i]];
			} else {
				return false;
			}
		}
		return true;
	};

	Config.prototype.get = function(key, defaultValue, isRequired) {

		// console.log("about to load config", key, this.config);

		isRequired = isRequired || false;

		var pointer = this.config;

		var splittedKeys = key.split('.');
		var i = 0;

		// console.log("splittedKeys", splittedKeys); 

		for(i = 0; i < splittedKeys.length; i++) {

			if (pointer.hasOwnProperty(splittedKeys[i])) {
				// console.log("POINTING TO " + splittedKeys[i]);
				pointer = pointer[splittedKeys[i]];
			} else {
				pointer = undefined;
				break;
			}
		}

		if (typeof pointer === 'undefined') {
			if (isRequired) {
				throw new Error("Configuration option [" + splittedKeys[i] + "] required but not provided.");
			}
			return defaultValue;
		}
		return pointer;
	};

	return Config;
});