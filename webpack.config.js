var webpack = require('webpack');

module.exports = {
    entry: './src/NormalizrImmutable',
    module: {
        loaders: [
            {
              test: /\.js$/,
              loader: 'babel',
              exclude: /node_modules/,
              query: {
                presets: ['es2015']
              }
            }
        ]
    },
    output: {
        filename: 'dist/normalizr-immutable.min.js',
        libraryTarget: 'umd',
        library: 'normalizr-immutable'
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                warnings: false
            }
        })
    ]
};
