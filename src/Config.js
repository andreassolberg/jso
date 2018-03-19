export default class Config {
	constructor() {
    this.config = {};
		for(var i = 0; i < arguments.length; i++) {
      Object.assign(this.config, arguments[i]);
		}
	}

	has(key) {
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
	}

	getValue(key, defaultValue, isRequired) {
		var isRequired = isRequired || false;
		var pointer = this.config;
		var splittedKeys = key.split('.');
		var i = 0;
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
	}
}
