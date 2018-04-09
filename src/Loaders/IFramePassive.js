import BasicLoader from './BasicLoader'
import utils from '../utils'

export default class IFramePassive extends BasicLoader {

	constructor(url) {
		super(url)

		this.timeout = 5000
		this.callback = null
		this.isCompleted = false
    this.id = 'jso_passive_iframe_' + utils.uuid()

    // Create IE + others compatible event handler
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent"
    var eventer = window[eventMethod]
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message"

    this.iframe = document.createElement('iframe')
    this.iframe.setAttribute('id', this.id)
    this.iframe.setAttribute('src', url)

    this.iframe.addEventListener('load', (e) => {

      let object = null
      try {
        if (this.iframe.contentWindow.location.hash) {
          let encodedHash = this.iframe.contentWindow.location.hash.substring(1)
          object = utils.parseQueryString(encodedHash)
        } else if (this.iframe.contentWindow.location.search) {
          let encodedHash = this.iframe.contentWindow.location.search.substring(1)
          object = utils.parseQueryString(encodedHash)
        }

        if (object !== null) {
          this._completed(object)
        } else {
          this._failed(new Error("Failed to obtain response value from iframe"))
        }
      } catch( err) {
        // Most likely not able to access the content window because of same-origin policy.
        //
        // Ignore this error, as this is likely to happen during the SSO redirect loop, but the load
        // event may be triggered multiple times, so it is not neccessary a problem that the first is not
        // accessible.
      }

    })

	}

	execute() {
		return new Promise((resolve, reject) => {
			this.callback = resolve
      this.errorCallback = reject
      document.getElementsByTagName('body')[0].appendChild(this.iframe)

			setTimeout(() => {
				this._failed(new Error("Loading iframe timed out"))
			}, this.timeout)
		})
	}


	_cleanup() {
    let element = document.getElementById(this.id)
    element.parentNode.removeChild(element)
	}

  _failed(err) {
    if (!this.isCompleted) {
			if (this.errorCallback && typeof this.errorCallback === 'function') {
				this.errorCallback(err)
			}
			this.isCompleted = true
			this._cleanup()
		}
  }

	_completed(response) {
		if (!this.isCompleted) {
			if (this.callback && typeof this.callback === 'function') {
				this.callback(response)
			}
			this.isCompleted = true
			this._cleanup()
		}
	}
}
