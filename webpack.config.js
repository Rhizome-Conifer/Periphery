const path = require('path');
const HtmlWebPackPlugin = require( 'html-webpack-plugin' );

module.exports = {
    context: __dirname,
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new HtmlWebPackPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.worker\.js$/,
                use: { loader: 'worker-loader' },
            }
        ]
    }
};