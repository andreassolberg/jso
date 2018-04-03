import BasicLoader from './BasicLoader'
import utils from '../utils'

export default class HTTPRedirect extends BasicLoader {

	constructor(url) {
		super(url);

    console.error("Constructor IFrame...")

    console.error("URL IS: " +  url)

		this.timeout = 5000
		this.callback = null
		this.isCompleted = false

    // Create IE + others compatible event handler
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

    // Listen to message from child window
    eventer(messageEvent,(e) => {
      if (e.data === 'jso_iframe') {
        let nurl = this.iframe.getAttribute('src')
        console.error("URL", this.iframe)
      }
      console.log('parent received message!:  ',e.data);
    },false)


    this.iframe = document.createElement('iframe')
    this.iframe.setAttribute('id', 'jso_passive_iframe_' + utils.uuid())
    this.iframe.setAttribute('src', url)

    this.iframe.addEventListener('load', (e) => {
      console.error(" IS Loaded! ", e)
      console.log(this.iframe.contentWindow.location.hash)

      if (this.iframe.contentWindow.location.hash) {
        let encodedHash = this.iframe.contentWindow.location.hash.substring(1)
        let object = utils.parseQueryString(encodedHash)
        console.log("OBJECT", object)
      } else {
        console.error("Failed to obtain response value from iframe")
      }

    })


    // var el = document.getElementById('marker')
    // el.parentNode.insertBefore(ifrm, el)
    //
		// this.iframe = $('<iframe class="jso_messenger_iframe" style="display: none;" src="' + url + '"></iframe>')
		// 	.on('load', () => {
		// 		try {
		// 			var url = this.contentWindow.window.location.href;
		// 			this._completed(url);
    //
		// 		} catch(err) {
		// 			console.error("Security exception with iframe loading.", err);
		// 		}
    //
		// 	});

	}

	execute() {


    console.error(" ---- execute ----")
    document.getElementsByTagName('body')[0].appendChild(this.iframe)

    return Promise.resolve(null)


		var that = this;
    console.error("Execute IFrame...")
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
	}


	_cleanup() {
		this.iframe.remove();
	}

	_completed(url) {
		var that = this;
		if (!that.isCompleted) {
			if (that.callback && typeof that.callback === 'function') {
				that.callback(url);
			}
			this.isCompleted = true;
			this._cleanup();
		}
	}
}
