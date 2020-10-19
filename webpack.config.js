const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, options) => {
    return {
        watch: true,
        watchOptions: {
            aggregateTimeout: 100,
            poll: 1000
        },
        devServer: {
            contentBase: './dist',
            hot: true
        },

        entry: {
            app: ['core-js/stable', './src/triangulation.ts']
        },

        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'triangulation.js',
        },

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: 'babel-loader',
                    },
                    exclude: /node_modules/
                },

            ],
        },

        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
              title: 'Hot Module Replacement',
            }),
          ]
    }
};