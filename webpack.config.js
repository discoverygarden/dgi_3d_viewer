const path = require('path');

module.exports = {
  entry: './js/dgi_3d_viewer.es6.js',
  output: {
    filename: 'dgi_3d_viewer.js',
    path: path.resolve(__dirname, 'js'),
  },
  resolve: {
    alias: {
      three: path.resolve(__filename, '/opt/www/drupal/libraries/three/build/three.module.js'),
      addons: path.resolve(__dirname, '/opt/www/drupal/libraries/three/examples/jsm/')
    }
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
