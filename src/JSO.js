/**
 * JSO - Javascript OAuth Library
 * 	Version 4.0
 *  UNINETT AS - http://uninett.no
 *  Author: Andreas Åkre Solberg <andreas.solberg@uninett.no>
 *  Licence: Simplified BSD Licence
 *
 *  Documentation available at: https://github.com/andreassolberg/jso
 */


// Polyfills to support >= IE10
import assign from 'core-js/features/object/assign'
import 'core-js/features/array/includes'
import 'core-js/features/promise'
// ------

import store from './store'
import utils from './utils'

// Work in progress
// import Authentication from './Authentication/Authentication'

import BasicLoader from './Loaders/BasicLoader'
import HTTPRedirect from './Loaders/HTTPRedirect'
import IFramePassive from './Loaders/IFramePassive'
import Popup from './Loaders/Popup'

import Fetcher from './HTTP/Fetcher'
import FetcherJQuery from './HTTP/FetcherJQuery'

// import ExpiredTokenError from './errors/ExpiredTokenError'
// import HTTPError from './errors/HTTPError'
import OAuthResponseError from './errors/OAuthResponseError'

import Config from './Config'
import EventEmitter from './EventEmitter'

const package_json = require('../package.json')

const default_config = {
 'lifetime': 3600
}

class JSO extends EventEmitter {
	constructor(config) {
    super()
		this.configure(config)
		this.providerID = this.getProviderID()
		this.Loader = HTTPRedirect
    this.store = store
		this.callbacks = {}

    if (this.config.getValue('debug', false)) {
      utils.debug = true
    }
	}

	configure(config) {
		this.config = new Config(default_config, config)
	}

  // Experimental, nothing but default store exists yet. Not documented.
  setStore(newstore) {
    this.store = newstore
  }

	setLoader(loader) {
		if (typeof loader === "function") {
			this.Loader = loader
		} else {
			throw new Error("loader MUST be an instance of the JSO BasicLoader")
		}
	}



	/**
	 * We need to get an identifier to represent this OAuth provider.
	 * The JSO construction option providerID is preferred, if not provided
	 * we construct a concatentaion of authorization url and client_id.
	 * @return {[type]} [description]
	 */
	getProviderID() {

		var c = this.config.getValue('providerID', null)
		if (c !== null) {return c}

		var client_id = this.config.getValue('client_id', null, true)
		var authorization = this.config.getValue('authorization', null, true)

		return authorization + '|' + client_id
	}

	/**
	 * If the callback has already successfully parsed a token response, call this.
	 * @return {[type]} [description]
	 */
	processTokenResponse(atoken) {
		let state
		if (atoken.state) {
			state = this.store.getState(atoken.state)
		} else {
			throw new Error("Could not get state from storage.")
		}

		if (!state) {
			throw new Error("Could not retrieve state")
		}
		if (!state.providerID) {
			throw new Error("Could not get providerid from state")
		}
		utils.log("processTokenResponse ", atoken, "")
    return this.processReceivedToken(atoken, state)
	}

  processReceivedToken(atoken, state) {
    /*
		 * Decide when this token should expire.
		 * Priority fallback:
		 * 1. Access token expires_in
		 * 2. Life time in config (may be false = permanent...)
		 * 3. Specific permanent scope.
		 * 4. Default library lifetime:
		 */
		let now = utils.epoch()
    atoken.received = now
		if (atoken.expires_in) {
			atoken.expires = now + parseInt(atoken.expires_in, 10)
      atoken.expires_in = parseInt(atoken.expires_in, 10)
		} else if (this.config.getValue('default_lifetime', null) === false) {
			atoken.expires = null
		} else if (this.config.has('permanent_scope')) {
			if (!this.store.hasScope(atoken, this.config.getValue('permanent_scope'))) {
				atoken.expires = null
			}
		} else if (this.config.has('default_lifetime')) {
			atoken.expires = now + this.config.getValue('default_lifetime')
		} else {
			atoken.expires = now + 3600
		}

		/*
		 * Handle scopes for this token
		 */
		if (atoken.scope) {
			atoken.scopes = atoken.scope.split(" ")
      delete atoken.scope
		} else if (state.scopes) {
			atoken.scopes = state.scopes
		} else {
			atoken.scopes = []
		}

    utils.log("processTokenResponse completed ", atoken, "")

		this.store.saveToken(state.providerID, atoken)

		if (state.restoreHash) {
			window.location.hash = state.restoreHash
		} else {
			window.location.hash = ''
		}
		return atoken
  }

  // Experimental support for authorization code to be added
  processAuthorizationCodeResponse(object) {
    console.log(this)
    this.emit('authorizationCode', object)


		let state
		if (object.state) {
			state = this.store.getState(object.state)
      if (state === null) {
        throw new Error("Could not find retrieve state object.")
      }
		} else {
			throw new Error("Could not find state paramter from callback.")
		}
    console.log("state", state)

    if (!this.config.has('token')) {
      utils.log("Received an authorization code. Will not process it as the config option [token] endpoint is not set. If you would like to process the code yourself, please subscribe to the [authorizationCode] event")
      return
    }
    if (!this.config.has('client_secret')) {
      throw new Error("Configuration missing [client_secret]")
    }
    let headers = new Headers()
    headers.append('Authorization', 'Basic ' + btoa(this.config.getValue('client_id') + ":" + this.config.getValue('client_secret')))
    headers.append('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8')

    let tokenRequest = {
      'grant_type': 'authorization_code',
      'code': object.code
    }

    if (state.hasOwnProperty('redirect_uri')) {
      tokenRequest.redirect_uri = state.redirect_uri
    }

    let opts = {
      mode: 'cors',
      headers: headers,
      method: 'POST', // or 'PUT'
      body: utils.encodeQS(tokenRequest), // data can be `string` or {object}!
    }
    return fetch(this.config.getValue('token'), opts)
      .then((httpResponse) => {
        return httpResponse.json()
      })
      .then((tokenResponse) => {
        // let tokenResponse = httpResponse.json()
        utils.log("Received response on token endpoint ", tokenResponse, "")
        return this.processReceivedToken(tokenResponse, state)
      })

    // throw new Exception("Implementation of authorization code flow is not yet implemented. Instead use the implicit grant flow")

  }



	processErrorResponse(err) {

		var state
		if (err.state) {

			state = this.store.getState(err.state)
		} else {
			throw new Error("Could not get [state] and no default providerid is provided.")
		}

		if (!state) {
			throw new Error("Could not retrieve state")
		}
		if (!state.providerID) {
			throw new Error("Could not get providerid from state")
		}

		if (state.restoreHash) {
			window.location.hash = state.restoreHash
		} else {
			window.location.hash = ''
		}
		return new OAuthResponseError(err)

	}


	/**
	 * Check if the hash contains an access token.
	 * And if it do, extract the state, compare with
	 * config, and store the access token for later use.
	 *
	 * The url parameter is optional. Used with phonegap and
	 * childbrowser when the jso context is not receiving the response,
	 * instead the response is received on a child browser.
	 */
	callback(data) {

    let response = null
    if (typeof data === 'object') {
      response = data
    } else if (typeof data === 'string') {
      response = utils.getResponseFromURL(data)
    } else if (typeof data === 'undefined') {
      response = utils.getResponseFromURL(window.location.href)
    } else {
      // no response provided.
      return
    }

    utils.log('Receving response in callback', response)

		if (response.hasOwnProperty("access_token")) {
			return this.processTokenResponse(response)

    // Implementation of authorization code flow is in beta.
		} else if (response.hasOwnProperty("code")) {
      return this.processAuthorizationCodeResponse(response)

		} else if (response.hasOwnProperty("error")) {
			throw this.processErrorResponse(response)
		}

	}


	dump() {
		var tokens = this.store.getTokens(this.providerID)
		var x = {
			"providerID": this.providerID,
			"tokens": tokens,
			"config": this.config
		}
		return x
	}

	_getRequestScopes(opts) {
		var scopes = [], i
		/*
		 * Calculate which scopes to request, based upon provider config and request config.
		 */
		if (this.config.has('scopes.request')) {
      let s = this.config.getValue('scopes.request')
			for(i = 0; i < s.length; i++) {
        scopes.push(s[i])
      }
		}
		if (opts && opts.scopes && opts.scopes.request) {
			for(i = 0; i < opts.scopes.request.length; i++) {scopes.push(opts.scopes.request[i])}
		}
		return utils.uniqueList(scopes)
	}

	_getRequiredScopes(opts) {
		var scopes = [], i
		/*
		 * Calculate which scopes to request, based upon provider config and request config.
		 */
		if (this.config.has('scopes.require')) {
      let s = this.config.getValue('scopes.require')
      for(i = 0; i < s.length; i++) {
        scopes.push(s[i])
      }
		}
		if (opts && opts.scopes && opts.scopes.require) {
			for(i = 0; i < opts.scopes.require.length; i++) {scopes.push(opts.scopes.require[i])}
		}
		return utils.uniqueList(scopes)
	}


	/**
	 * If getToken is called with allowia = false, and a token is not cached, it will return null.
	 * The scopes.required is used to pick from existing tokens.
	 *
	 * @param  {[type]} opts [description]
	 * @return {[type]}      [description]
	 */
	getToken(opts) {
    opts = opts || {}

    return new Promise((resolve, reject) => {

      let scopesRequire = this._getRequiredScopes(opts)
			let token = this.store.getToken(this.providerID, scopesRequire)

			if (token) {
				return resolve(token)

			} else {

				if (opts.hasOwnProperty("allowredir") && !opts.allowredir) {
					throw new Error("Cannot obtain a token, when not allowed to redirect...")

				} else {
					resolve(this._authorize(opts))
				}
			}
    })

	}

	checkToken(opts) {
		// var scopesRequest  = this._getRequestScopes(opts)

		var scopesRequire = this._getRequiredScopes(opts)
		return this.store.getToken(this.providerID, scopesRequire)
	}


	/**
	 * Send authorization request.
	 *
	 * @param  {[type]} opts These options matches the ones sent in the "oauth" property of the ajax settings in the request.
	 * @return {[type]}      [description]
	 */
	_authorize(opts) {
		var
			request,
			authurl,
			scopes

		return Promise.resolve().then(() => {

			let authorization = this.config.getValue('authorization', null, true)
			let client_id = this.config.getValue('client_id', null, true)
      let openid = false

      if (opts.hasOwnProperty('allowia') || this.config.has('allowia')) {
        throw new Error('The allowia option was removed in JSO 4.1.0. Instead use {request: {prompt: "none"}}')
      }

			utils.log("About to send an authorization request to this endpoint", authorization)
			utils.log("Options", opts)

			request = {}

      if (this.config.has('request')) {
        let r = this.config.getValue('request')
        request = assign(request, r)
      }
      if (opts.hasOwnProperty('request')) {
        request = assign(request, opts.request)
      }


      request.response_type = opts.response_type || this.config.getValue('response_type', 'id_token token')
      request.state = utils.uuid()

			if (this.config.has('redirect_uri')) {
				request.redirect_uri = this.config.getValue('redirect_uri', '')
			}
			if (opts.redirect_uri) {
				request.redirect_uri = opts.redirect_uri
			}

			request.client_id = client_id


			/*
			 * Calculate which scopes to request, based upon provider config and request config.
			 */
			scopes = this._getRequestScopes(opts)
      openid = scopes.includes('openid')
			if (scopes.length > 0) {
				request.scope = utils.scopeList(scopes)
			}
      utils.log("Running in mode: " + (openid ? 'OpenID Connect mode' : 'OAuth mode'))

      if (openid && !request.hasOwnProperty('redirect_uri')) {
        throw new Error('An OpenID Request requires a redirect_uri to be set. Please add to configuration. A redirect_uri is not required for plain OAuth')
      }

      if (openid) {
        request.nonce = utils.uuid()
      }

			utils.log("Debug Authentication request object", JSON.stringify(request, undefined, 2))

			authurl = utils.encodeURL(authorization, request)

			// We'd like to cache the hash for not loosing Application state.
			// With the implciit grant flow, the hash will be replaced with the access
			// token when we return after authorization.
			if (window.location.hash) {
				request.restoreHash = window.location.hash
			}
			request.providerID = this.providerID
			if (scopes) {
				request.scopes = scopes
			}


			utils.log("Saving state [" + request.state + "]")
			utils.log(JSON.parse(JSON.stringify(request)))

			var loader = this.Loader
			if (opts.hasOwnProperty("loader")) {
				loader = opts.loader
			}

			utils.log("Looking for loader", opts, loader)

			this.store.saveState(request.state, request)
			return this.gotoAuthorizeURL(authurl, loader)
				.then((response) => {
          if (response !== true) {
            return this.callback(response)
          }
				})


		})

	}

	gotoAuthorizeURL(url, Loader) {
		return new Promise(function(resolve, reject) {
			if (Loader !== null && typeof Loader === 'function') {
				var loader = new Loader(url)
				if (!(loader instanceof BasicLoader)) {
					throw new Error("JSO selected Loader is not an instance of BasicLoader.")
				}
				resolve(loader.execute())
			} else {
				reject(new Error('Cannot redirect to authorization endpoint because of missing redirect handler'))
			}
		})
	}

	wipeTokens() {
		this.store.wipeTokens(this.providerID)
	}

}

// Object.assign(JSO.prototype, new EventEmitter({}))

export {JSO, BasicLoader, HTTPRedirect, Popup, IFramePassive, Fetcher, FetcherJQuery}
// Work in progress
// Authentication
