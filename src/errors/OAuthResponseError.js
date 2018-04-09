import Error from './Error'

export default class OAuthResponseError extends Error {

  toString() {
    let header = this.error || 'unknown'
    let descr = this.error_description || 'unknown'
    return 'OAuthResponseError: [' + header + ']: ' + descr
  }
}
