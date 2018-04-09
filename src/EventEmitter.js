export default class EventEmitter {

  on(type, callback) {
    if (!this._callbacks) {
      this._callbacks = {}
    }
    if (!this._callbacks[type]) {
      this._callbacks[type] = []
    }

    this._callbacks[type].push(callback)
  }

  emit(type) {
    if (!this._callbacks) {
      this._callbacks = {}
    }
    if (!this._callbacks[type]) {
      this._callbacks[type] = []
    }

    var args = Array.prototype.slice.call(arguments, 1)
    for(var i = 0; i < this._callbacks[type].length; i++) {
      this._callbacks[type][i].apply(this, args)
    }
  }
}
