import BasicLoader from './BasicLoader'
import utils from '../utils'

export default class HTTPRedirect extends BasicLoader {
	execute() {
		return new Promise((resolve, reject) => {
      utils.log("HTTPRedirect sending user to url", this.url)
			window.location = this.url
			resolve(true)
		})
	}
}
