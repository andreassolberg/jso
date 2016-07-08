
export default class Error {
	constructor(props) {
		for(var key in props) {
			this[key] = props[key];
		}
	}

	set(key, value) {
		this[key] = value;
		return this;
	}
}