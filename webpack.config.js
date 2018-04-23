const path = require('path')

module.exports = {
  entry: './src/JSO.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'jso.js',
    library: 'jso',
    libraryTarget: 'umd'
  },
  devtool: "source-map",

  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, './src'),
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ["env", {
                  useBuiltIns: 'entry'
              }],
              "react"
            ]
          }
        }
      }

    ]
  }
}
