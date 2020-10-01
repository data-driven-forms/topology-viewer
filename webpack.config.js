const webpack = require('webpack');
const path = require('path');
const { merge } = require('webpack-merge');

const commonConfig = {
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: [
      '.js',
      '.jsx',
    ],
  },
  devServer: {
    contentBase: './dist',
  },
};

const prodConfig = {
  entry: './src/index.js',
  mode: 'production',
  output: {
    path: path.resolve('./dist'),
    library: '[name]',
    libraryTarget: 'umd',
    filename: 'index.js',
  },
};

const devConfig = {
  entry: './demo/index.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
};

module.exports = env => ({
  dev: merge(commonConfig, devConfig),
  prod: merge(commonConfig, prodConfig),
})[env];
