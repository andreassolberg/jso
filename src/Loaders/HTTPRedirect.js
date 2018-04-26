import BasicLoader from './BasicLoader'
import utils from '../utils'

export default class HTTPRedirect extends BasicLoader {
	execute() {
		return new Promise((resolve, reject) => {
			window.location = this.url
			resolve(true)
		})
	}
}
