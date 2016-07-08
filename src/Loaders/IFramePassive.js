import BasicLoader from './BasicLoader';

export default class HTTPRedirect extends BasicLoader {

	constructor(url) {
		super(url);
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
					console.error("Security exception with iframe loading.", err);
				}

			});

	}

	execute() {
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


