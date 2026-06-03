// jshint browser: false, esversion: 11
const path = require('path');

module.exports = {
  entry: {
    dgi_3d_viewer: {
      import: './js/dgi_3d_viewer.es6.js',
      dependOn: [
        "three",
        "spinjs",
      ],
    },
    three: "three",
    spinjs: "spin.js",
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'js/dist'),
  },
  devServer: {
    compress: true,
    port: 9000,
  },
  module: {
    rules: [
      {
        test: /.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            compact: false,
            presets: [
              [
                '@babel/preset-env',
                {
                  modules: "auto"
                }
              ]
            ],
            plugins: []
          }
        }
      }
    ]
  }
};
