(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module
        //in another project. That other project will only
        //see this AMD call, not the internal modules in
        //the closure below.
        define([], factory);
    } else {
        //Browser globals case. Just assign the
        //result to a property on the global.
        root.JSO = factory();
    }
}(this, function () {
    //almond, and your modules will be inlined here
/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../bower_components/almond/almond", function(){});

define('utils',['require','exports','module'],function(require, exports, module) {


	var utils = {};


	/*
	 * Returns epoch, seconds since 1970.
	 * Used for calculation of expire times.
	 */
	utils.epoch = function() {
		return Math.round(new Date().getTime()/1000.0);
	};


	/*
	 * Returns a random string used for state
	 */
	utils.uuid = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
	};



	utils.parseQueryString = function (qs) {
		var e,
			a = /\+/g,  // Regex for replacing addition symbol with a space
			r = /([^&;=]+)=?([^&;]*)/g,
			d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
			q = qs,
			urlParams = {};

		/* jshint ignore:start */
		while (e = r.exec(q)) {
		   urlParams[d(e[1])] = d(e[2]);
		};
		/* jshint ignore:end */

		return urlParams;
	};





	/**
	 * Utility: scopeList(scopes )
	 * Takes a list of scopes that might be overlapping, and removed duplicates,
	 * then concatenates the list by spaces and returns a string.
	 * 
	 * @param  {[type]} scopes [description]
	 * @return {[type]}        [description]
	 */
	utils.scopeList = function(scopes) {
		return utils.uniqueList(scopes).join(' ');
	};


	utils.uniqueList = function(items) {
		var uniqueItems = {};
		var resultItems = [];
		for(var i = 0; i < items.length; i++) {
			uniqueItems[items[i]] = 1;
		}
		for(var key in uniqueItems) {
			if (uniqueItems.hasOwnProperty(key)) {
				resultItems.push(key);
			}
		}
		return resultItems;
	};





	/*
	 * Returns a random string used for state
	 */
	utils.uuid = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	};

	/**
	 * A log wrapper, that only logs if logging is turned on in the config
	 * @param  {string} msg Log message
	 */
	utils.log = function(msg) {
		// if (!options.debug) return;
		if (!console) return;
		if (!console.log) return;

		// console.log("LOG(), Arguments", arguments, msg)
		if (arguments.length > 1) {
			console.log(arguments);	
		} else {
			console.log(msg);
		}
		
	};

	/**
	 * Set the global options.
	 */
	// utils.setOptions = function(opts) {
	// 	if (!opts) return;
	// 	for(var k in opts) {
	// 		if (opts.hasOwnProperty(k)) {
	// 			options[k] = opts[k];
	// 		}
	// 	}
	// 	log("Options is set to ", options);
	// }


	/* 
	 * Takes an URL as input and a params object.
	 * Each property in the params is added to the url as query string parameters
	 */
	utils.encodeURL = function(url, params) {
		var res = url;
		var k, i = 0;
		var firstSeparator = (url.indexOf("?") === -1) ? '?' : '&';
		for(k in params) {
			res += (i++ === 0 ? firstSeparator : '&') + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
		}
		return res;
	};

	/*
	 * Returns epoch, seconds since 1970.
	 * Used for calculation of expire times.
	 */
	utils.epoch = function() {
		return Math.round(new Date().getTime()/1000.0);
	};




	return utils;

});
//define(['utils'], function(utils) {

define('store',['require','exports','module','./utils'],function(require, exports, module) {

	var utils = require('./utils');
	var store = {};


	/**
		saveState stores an object with an Identifier.
		TODO: Ensure that both localstorage and JSON encoding has fallbacks for ancient browsers.
		In the state object, we put the request object, plus these parameters:
		  * restoreHash
		  * providerID
		  * scopes

	 */
	store.saveState = function (state, obj) {
		localStorage.setItem("state-" + state, JSON.stringify(obj));
	};
	
	/**
	 * getStage()  returns the state object, but also removes it.
	 * @type {Object}
	 */
	store.getState = function(state) {
		// log("getState (" + state+ ")");
		var obj = JSON.parse(localStorage.getItem("state-" + state));
		localStorage.removeItem("state-" + state);
		return obj;
	};


	/**
	 * A log wrapper, that only logs if logging is turned on in the config
	 * @param  {string} msg Log message
	 */
	var log = function(msg) {
		// if (!options.debug) return;
		if (!console) return;
		if (!console.log) return;

		// console.log("LOG(), Arguments", arguments, msg)
		if (arguments.length > 1) {
			console.log(arguments);	
		} else {
			console.log(msg);
		}
		
	};


	/*
	 * Checks if a token, has includes a specific scope.
	 * If token has no scope at all, false is returned.
	 */
	store.hasScope = function(token, scope) {
		var i;
		if (!token.scopes) return false;
		for(i = 0; i < token.scopes.length; i++) {
			if (token.scopes[i] === scope) return true;
		}
		return false;
	};

	/*
	 * Takes an array of tokens, and removes the ones that
	 * are expired, and the ones that do not meet a scopes requirement.
	 */
	store.filterTokens = function(tokens, scopes) {
		var i, j, 
			result = [],
			now = utils.epoch(),
			usethis;

		if (!scopes) scopes = [];

		for(i = 0; i < tokens.length; i++) {
			usethis = true;

			// Filter out expired tokens. Tokens that is expired in 1 second from now.
			if (tokens[i].expires && tokens[i].expires < (now+1)) usethis = false;

			// Filter out this token if not all scope requirements are met
			for(j = 0; j < scopes.length; j++) {
				if (!store.hasScope(tokens[i], scopes[j])) usethis = false;
			}

			if (usethis) result.push(tokens[i]);
		}
		return result;
	};


	/*
	 * saveTokens() stores a list of tokens for a provider.

		Usually the tokens stored are a plain Access token plus:
		  * expires : time that the token expires
		  * providerID: the provider of the access token?
		  * scopes: an array with the scopes (not string)
	 */
	store.saveTokens = function(provider, tokens) {
		// log("Save Tokens (" + provider+ ")");
		localStorage.setItem("tokens-" + provider, JSON.stringify(tokens));
	};

	store.getTokens = function(provider) {
		// log("Get Tokens (" + provider+ ")");
		var tokens = JSON.parse(localStorage.getItem("tokens-" + provider));
		if (!tokens) tokens = [];

		log("Token received", tokens);
		return tokens;
	};
	store.wipeTokens = function(provider) {
		localStorage.removeItem("tokens-" + provider);
	};
	/*
	 * Save a single token for a provider.
	 * This also cleans up expired tokens for the same provider.
	 */
	store.saveToken = function(provider, token) {
		var tokens = this.getTokens(provider);
		tokens = store.filterTokens(tokens);
		tokens.push(token);
		this.saveTokens(provider, tokens);
	};

	/*
	 * Get a token if exists for a provider with a set of scopes.
	 * The scopes parameter is OPTIONAL.
	 */
	store.getToken = function(provider, scopes) {
		var tokens = this.getTokens(provider);
		tokens = store.filterTokens(tokens, scopes);
		if (tokens.length < 1) return null;
		return tokens[0];
	};



	return store;
});

define('Config',[],function() {
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

/**
 * @package Simple JavaScript Inheritance
 * @description A very simple class inheritance framework, 
 *              that is used within Feide Connect for the Model implementations.
 * @author John Resig
 * @copyright John Resig, MIT Licensed. Inspired by base2 and Prototype
 * @version 1.0
 */
		

/* jshint ignore:start */


define('class',['require'],function(require) {



	/* Simple JavaScript Inheritance
	 * By John Resig http://ejohn.org/
	 * MIT Licensed.
	 */
	// Inspired by base2 and Prototype
	(function(){


		var 
			initializing = false, 
			fnTest = (/xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/);


		// The base Class implementation (does nothing)
		this.Class = function(){};
	 
		// Create a new Class that inherits from this class
		Class.extend = function(prop) {
			var _super = this.prototype;
		 
			// Instantiate a base class (but only create the instance,
			// don't run the init constructor)
			initializing = true;
			var prototype = new this();
			initializing = false;
		 

			// Copy the properties over onto the new prototype
			for (var name in prop) {
				// Check if we're overwriting an existing function
				prototype[name] = typeof prop[name] == "function" &&
					typeof _super[name] == "function" && fnTest.test(prop[name]) ?
					(function(name, fn){
						return function() {
							var tmp = this._super;
						 
							// Add a new ._super() method that is the same method
							// but on the super-class
							this._super = _super[name];
						 
							// The method only need to be bound temporarily, so we
							// remove it when we're done executing
							var ret = fn.apply(this, arguments);        
							this._super = tmp;
						 
							return ret;
						};
					})(name, prop[name]) :
					prop[name];
			}


			// The dummy class constructor
			function Class() {
				// All construction is actually done in the init method
				if ( !initializing && this.init )
					this.init.apply(this, arguments);
			}
		 
			// Populate our constructed prototype object
			Class.prototype = prototype;
		 
			// Enforce the constructor to be what we expect
			Class.prototype.constructor = Class;
	 
			// And make this class extendable
			Class.extend = arguments.callee;
		 
			return Class;
		};
	})();


	return this.Class;

});

/* jshint ignore:end */;
define('Loaders/BasicLoader',['require','exports','module','../class'],function(require, exports, module) {
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
define('Loaders/HTTPRedirect',['require','exports','module','../class','./BasicLoader'],function(require, exports, module) {
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
//define(['utils'], function(utils) {

define('Loaders/IFramePassive',['require','exports','module','../utils','../class','jquery','./BasicLoader'],function(require, exports, module) {
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



//define(['utils'], function(utils) {

define('Loaders/Popup',['require','exports','module','../utils','../class','jquery','./BasicLoader'],function(require, exports, module) {
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



/**
 * JSO - Javascript OAuth Library
 * 	Version 3.0
 *  UNINETT AS - http://uninett.no
 *  Author: Andreas Åkre Solberg <andreas.solberg@uninett.no>
 *  Licence: 
 *   	
 *  Documentation available at: https://github.com/andreassolberg/jso
 */

define('jso',['require','exports','module','./store','./utils','./Config','./class','./Loaders/BasicLoader','./Loaders/HTTPRedirect','./Loaders/IFramePassive','./Loaders/Popup'],function(require, exports, module) {

	var 
		default_config = {
			"lifetime": 3600,
			"debug": true
		};

	var store  = require('./store');
	var utils  = require('./utils');
	var Config = require('./Config');
	var Class  = require('./class');

	var BasicLoader = require('./Loaders/BasicLoader');
	var HTTPRedirect = require('./Loaders/HTTPRedirect');
	var IFramePassive = require('./Loaders/IFramePassive');
	var Popup = require('./Loaders/Popup');

	var JSO = Class.extend({
		"init": function(config) {
			this.config = new Config(default_config, config);
			this.providerID = this.getProviderID();

			this.Loader = HTTPRedirect;

			// JSO.instances[this.providerID] = this;

			this.callbacks = {};

		},


		"setLoader": function(loader) {

			if (typeof loader === "function") {
				this.Loader = loader;
			} else {
				throw new Error("loader MUST be an instance of the JSO BasicLoader");
			}

		},

		"on": function(eventid, callback) {
			if (typeof eventid !== 'string') {throw new Error('Registering triggers on JSO must be identified with an event id');}
			if (typeof callback !== 'function') {throw new Error('Registering a callback on JSO must be a function.');}

			this.callbacks[eventid] = callback;
		},

		/**
		 * We need to get an identifier to represent this OAuth provider.
		 * The JSO construction option providerID is preferred, if not provided
		 * we construct a concatentaion of authorization url and client_id.
		 * @return {[type]} [description]
		 */
		"getProviderID": function() {

			var c = this.config.get('providerID', null);
			if (c !== null) {return c;}

			var client_id = this.config.get('client_id', null, true);
			var authorization = this.config.get('authorization', null, true);

			return authorization + '|' + client_id;
		},


		/**
		 * If the callback has already successfully parsed a token response, call this.
		 * @return {[type]} [description]
		 */
		"processTokenResponse": function(atoken) {

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
		},


		"processErrorResponse": function(err) {

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

		},


		/**
		 * Check if the hash contains an access token. 
		 * And if it do, extract the state, compare with
		 * config, and store the access token for later use.
		 *
		 * The url parameter is optional. Used with phonegap and
		 * childbrowser when the jso context is not receiving the response,
		 * instead the response is received on a child browser.
		 */
		"callback": function(url) {

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
		},




		"dump": function() {
			var tokens = store.getTokens(this.providerID);
			var x = {
				"providerID": this.providerID,
				"tokens": tokens,
				"config": this.config
			};
			return x;
		},

		"_getRequestScopes": function(opts) {
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
		},

		"_getRequiredScopes": function(opts) {
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
		},


		/**
		 * If getToken is called with allowia = false, and a token is not cached, it will return null.
		 * The scopes.required is used to pick from existing tokens.
		 * 
		 * @param  {[type]} opts [description]
		 * @return {[type]}      [description]
		 */
		"getToken": function(opts) {

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

		},

		"checkToken": function(opts) {
			// var scopesRequest  = this._getRequestScopes(opts);
			
			var scopesRequire = this._getRequiredScopes(opts);
			return store.getToken(this.providerID, scopesRequire);
		},


		/**
		 * Send authorization request.
		 * 
		 * @param  {[type]} opts These options matches the ones sent in the "oauth" property of the ajax settings in the request.
		 * @return {[type]}      [description]
		 */
		"_authorize": function(opts) {
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

		},

		"gotoAuthorizeURL": function(url, Loader) {

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

		},

		"wipeTokens": function() {
			store.wipeTokens(this.providerID);
		},


		"request": function(opts) {

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

		},


		"ajax": function(settings) {

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



			
		},












		"inappbrowser": function(params) {
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
	});


	// JSO.internalStates = [];
	JSO.instances = {};
	JSO.store = store;
	JSO.utils = utils;


	JSO.enablejQuery = function($) {
		JSO.$ = $;
	};


	JSO.Error = Class.extend({
		"init": function(props) {
			for(var key in props) {
				this[key] = props[key];
			}
		},
		"set": function(key, value) {
			this[key] = value;
			return this;
		}
	});

	JSO.OAuthResponseError = JSO.Error.extend({
		"init": function(props) {
			for(var key in props) {
				this[key] = props[key];
			}
		}
	});

	JSO.ExpiredTokenError = JSO.Error.extend({
		"init": function(props) {
			for(var key in props) {
				this[key] = props[key];
			}
		}
	});


	JSO.HTTPError = JSO.Error.extend({
		"init": function(props) {
			for(var key in props) {
				this[key] = props[key];
			}
		}
	});


	/**
	 * Do some sanity checking whether an URL contains a access_token in an hash fragment.
	 * Used in URL change event trackers, to detect responses from the provider.
	 * @param {[type]} url [description]
	 */
	JSO.prototype.URLcontainsToken = function(url) {
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
	};



	JSO.Popup = Popup;
	JSO.IFramePassive = IFramePassive;
	JSO.HTTPRedirect = HTTPRedirect;



	return JSO;


});

    //The modules for your project will be inlined above
    //this snippet. Ask almond to synchronously require the
    //module value for 'main' here and return it as the
    //value to use for the public API for the built file.
    return require('jso');
}));
