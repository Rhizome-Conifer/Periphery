const path = require('path');
const HtmlWebPackPlugin = require( 'html-webpack-plugin' );
const WorkerPlugin = require('worker-plugin');

module.exports = {
    context: __dirname,
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
<<<<<<< HEAD
        new HtmlWebPackPlugin(),
        new WorkerPlugin()
    ]
=======
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
>>>>>>> ec2b7cedcb617c90d54a73eb8a518e886b31a58e
};