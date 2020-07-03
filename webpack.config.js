const path = require('path');

module.exports = {
    entry: './src/boundary-sidebar.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
};