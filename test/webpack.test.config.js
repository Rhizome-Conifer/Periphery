const path = require('path');

module.exports = {
    entry: "./test/boundary.test.js",
    output: {
      path: path.resolve(__dirname, "."),
      filename: "bundle.test.js"
    },
    mode: "none"
};