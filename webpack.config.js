const webpack = require('webpack');

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const dotenv = require('dotenv');
const fs = require('fs');

const isProduction = process.env.NODE_ENV === "production";

// Load environment variables
let envConfig = {};
if (!isProduction && fs.existsSync(".env-cmdrc.json")) {
  const envFile = JSON.parse(fs.readFileSync(".env-cmdrc.json", "utf8"));
  envConfig = envFile[process.env.NODE_ENV] || {};
} else {
  envConfig = Object.fromEntries(Object.entries(process.env));
}

// Convert JSON to a format Webpack understands
const envKeys = Object.keys(envConfig).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(envConfig[next]);
  return prev;
}, {});

module.exports = {
  mode: isProduction ? "production" : "development",

  watch: !isProduction,
  watchOptions: {
    ignored: /node_modules/,
  },

  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: isProduction ? "js/[name].[contenthash].js" : "js/[name].js",
    publicPath: isProduction ? "./" : "/",
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader",  "postcss-loader",],
      },
      {
        test: /\.py$/,
        use: "raw-loader", // Load Python files as raw text
      },
      {
        test: /\.svg$/,
        use: ["@svgr/webpack"], // Enables importing SVGs as React components
      },
      {
        test: /\.(png|jpe?g|gif|ico)$/,
        type: "asset/resource", // Handles image files
      },
    ],
  },

  plugins: [
    new webpack.DefinePlugin(envKeys),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      minify: isProduction,
      inject: true,
      templateParameters: envConfig
    }),
    (isProduction ? new MiniCssExtractPlugin({ filename: 'styles.[contenthash].css' }) : new MiniCssExtractPlugin()),
    new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "src/assets"), 
            to: "assets", // Copies to `dist/assets`
            noErrorOnMissing: true, // Prevents errors if the folder is missing
          },
          { from: 'public', to: '', noErrorOnMissing: true, globOptions: { ignore: ['**/index.html'] }}, // Copies everything else from public to dist
        ],
    }),
  
  ],

  optimization: isProduction
    ? {
        minimize: true,
        minimizer: [new CssMinimizerPlugin()],
      }
    : {},

  devServer: {
    static: path.join(__dirname, "public"),
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
};
