const path = require('path');

module.exports = {
  entry: './js/test_threejs.es6.js',
  output: {
    filename: 'test_threejs.js',
    path: path.resolve(__dirname, 'js/dist'),
  },
  module: {
    rules: [
      {
        test: /.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
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
