const path = require('path');

module.exports = {
  entry: './src/JSO.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'jso.js',
    library: 'jso',
    libraryTarget: 'umd'
  }
}
