class Config {
	constructor() {
		console.log("Config");
	}
}

export default Config

// export default class Config {
// 	constructor() {
// 		var ca = [{}];
// 		for(var i = 0; i < arguments.length; i++) {
// 			ca.push(arguments[i]);
// 		}
// 		this.config = {};
// 		Object.assign(this.config, ca);
// 	}

// 	has(key) {
// 		var pointer = this.config;
// 		var splittedKeys = key.split('.');
// 		var i = 0;

// 		for(i = 0; i < splittedKeys.length; i++) {
// 			if (pointer.hasOwnProperty(splittedKeys[i])) {
// 				pointer = pointer[splittedKeys[i]];
// 			} else {
// 				return false;
// 			}
// 		}
// 		return true;
// 	}

// 	getValue(key, defaultValue, isRequired) {

// 		// console.log("about to load config", key, this.config);

// 		var isRequired = isRequired || false;

// 		var pointer = this.config;

// 		var splittedKeys = key.split('.');
// 		var i = 0;

// 		// console.log("splittedKeys", splittedKeys);

// 		for(i = 0; i < splittedKeys.length; i++) {

// 			if (pointer.hasOwnProperty(splittedKeys[i])) {
// 				// console.log("POINTING TO " + splittedKeys[i]);
// 				pointer = pointer[splittedKeys[i]];
// 			} else {
// 				pointer = undefined;
// 				break;
// 			}
// 		}

// 		if (typeof pointer === 'undefined') {
// 			if (isRequired) {
// 				throw new Error("Configuration option [" + splittedKeys[i] + "] required but not provided.");
// 			}
// 			return defaultValue;
// 		}
// 		return pointer;
// 	}
// }
