const WorkerPlugin = require("worker-plugin");
const path = require("path");
module.exports = {
  mode: "none",
  entry: "./src/index.js",
  devtool: "cheap-module-eval-source-map",
  node: {
    fs: "empty",
  },
  output: {
    path: __dirname + "/dist",
    filename: "bundle.js",
  },
  devServer: {
    contentBase: [path.join(__dirname, "public"), path.join(__dirname, "dist")],
  },
  plugins: [new WorkerPlugin()],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: [
              [
                "@babel/plugin-transform-runtime",
                {
                  absoluteRuntime: false,
                  corejs: false,
                  helpers: true,
                  regenerator: true,
                  useESModules: false,
                  version: "7.0.0-beta.0",
                },
              ],
            ],
          },
        },
      },
    ],
  },
};
