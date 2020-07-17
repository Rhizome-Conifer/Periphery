const path = require('path');

module.exports = {
    entry: "./test/main.test.js",
    output: {
      path: path.resolve(__dirname, "."),
      filename: "bundle.test.js"
    },
    mode: "none"
};