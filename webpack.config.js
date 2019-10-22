/**
 * Created by Aaron on 2019/10/12.
 */
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CacheHelper =require("./CacheHelper");
module.exports = {
    entry: {index:path.resolve(__dirname,"./src/index.js"),index1:path.resolve(__dirname,"./src/index1.js")},
    output: {
        path: path.resolve(__dirname,"build"),
        filename: "[name].js"
    },
    devtool:"source-map",
    plugins:[
        new HtmlWebpackPlugin({
            entryName: "index",
            inject: 'head',
            filename: `index.html`,
            template: path.resolve(__dirname,"index.html"),
            chunks: ["index"],
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                keepClosingSlash: true,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true
            }
        }),
        new HtmlWebpackPlugin({
            entryName: "index1",
            inject: 'head',
            filename: `index1.html`,
            chunks: ["index1"],
            template: path.resolve(__dirname,"index1.html"),
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                keepClosingSlash: true,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true
            }
        }),
        new CacheHelper({
            cache: [
                'index1.js',
            ],
            timestamp: true,
            name:'cache',
            network: [
                '*'
            ],
            description: "v1.0.0",
            entryHtmls: ['index.html']
        })
    ]
}