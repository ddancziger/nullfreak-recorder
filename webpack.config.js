const path = require("path");

module.exports = {
  entry: "./src/freakrecorder.tsx", // Change this if your entry point is a TypeScript file
  output: {
    filename: "freakrecorder.min.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "umd",
    globalObject: "this",
  },
  mode: "production",
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      // Add TypeScript loader
      {
        test: /\.tsx?$/, // Handle both .ts and .tsx files
        use: "ts-loader",
        exclude: /node_modules/,
      },
      // Existing loader for JavaScript files
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
};
