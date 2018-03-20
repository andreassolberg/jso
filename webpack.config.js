const path = require('path');

module.exports = {
  entry: './src/JSO.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'jso.js',
    library: 'jso',
    libraryTarget: 'umd'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  }
}
