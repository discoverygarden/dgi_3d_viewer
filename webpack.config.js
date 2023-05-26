const path = require('path');

module.exports = {
  entry: './js/dgi_3d_viewer.es6.js',
  output: {
    filename: 'dgi_3d_viewer.js',
    path: path.resolve(__dirname, 'js/dist'),
  },
  resolve: {
    alias: {
      three: path.resolve(__filename, '/opt/www/drupal/libraries/three/build/three.module.js'),
      addons: path.resolve(__dirname, '/opt/www/drupal/libraries/three/examples/jsm/')
    }
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
