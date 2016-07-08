import BasicLoader from './BasicLoader';

export default class HTTPRedirect extends BasicLoader {
	execute() {
		var that = this
		return new Promise(function(resolve, reject) {
			window.location = that.url
			resolve()
		})
	}
}
