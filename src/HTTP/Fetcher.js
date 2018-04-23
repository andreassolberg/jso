
class TokenExpiredException extends Error {

}

export default class Fetcher {
	constructor(jso) {
    this.jso = jso
	}

  _fetch(url, opts) {
    return fetch(url, opts)
      .then((response) => {
        if (response.status === 401) {
          throw new TokenExpiredException()
        }
        return response
      })
  }

	fetch(url, opts, reccur) {
    reccur = reccur ? reccur : 0
    if (reccur > 2) {
      throw new Error("Reccursion error. Expired tokens deleted and tried again multiple times.")
    }
    let getTokenOpts = {}
    let fetchOpts = {
      'mode': 'cors'
    }
    if (opts) {
      fetchOpts = opts
      Object.assign(fetchOpts, opts)
    }
    if (opts && opts.jso) {
      Object.assign(getTokenOpts, opts.jso)
    }

    return this.jso.getToken(getTokenOpts)
      .catch((err) => {
        console.error("Error fetching token to use ", err)
      })
      .then((token) => {
      	// console.log("I got the token: ", token.access_token)

        if (!fetchOpts.headers) {
          fetchOpts.headers = {}
        }
        fetchOpts.headers.Authorization = 'Bearer ' + token.access_token
        return this._fetch(url, fetchOpts)
          .catch((err) => {
            if (err instanceof TokenExpiredException) {
              console.error("Token was expired. Deleting all tokens for this provider and get a new one", err)
              this.jso.wipeTokens()
              return this.fetch(url, opts, reccur+1)
            }
          })

      })
	}



}
