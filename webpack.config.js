import { fileURLToPath } from 'url';
import ESLintPlugin from 'eslint-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import { readFile } from 'fs/promises';

// read version from package.json
const pk = JSON.parse(await readFile(new URL('package.json', import.meta.url)));
process.env.ULTRAVIOLET_VERSION = pk.version;

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * @type {import('webpack').Configuration}
 */
const config = {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'eval' : 'source-map',
    entry: {
        bundle: fileURLToPath(
            new URL('./src/rewrite/index.js', import.meta.url)
        ),
        client: fileURLToPath(
            new URL('./src/client/index.js', import.meta.url)
        ),
        handler: fileURLToPath(new URL('./src/uv.handler.js', import.meta.url)),
        sw: fileURLToPath(new URL('./src/uv.sw.js', import.meta.url)),
    },
    output: {
        path: fileURLToPath(new URL('./dist/', import.meta.url)),
        filename: 'uv.[name].js',
    },
    module: {
        rules: [
            {
                test: /\.(js|mjs)$/,
                enforce: 'pre',
                use: [
                    {
                        loader: 'source-map-loader',
                        options: {
                            filterSourceMappingUrl: (url, resourcePath) =>
                                // parse5 references sourcemaps but doesn't publish them
                                !resourcePath.includes('parse5'),
                        },
                    },
                ],
            },
        ],
    },
    optimization: {
        minimize: !isDevelopment,
        minimizer: [
            new TerserPlugin({
                exclude: ['sw.js', 'uv.config.js'],
            }),
        ],
    },
    plugins: [
        new ESLintPlugin(),
        new CopyPlugin({
            patterns: [
                {
                    from: fileURLToPath(
                        new URL('./src/uv.config.js', import.meta.url)
                    ),
                },
                {
                    from: fileURLToPath(
                        new URL('./src/sw.js', import.meta.url)
                    ),
                },
            ],
        }),
        new webpack.EnvironmentPlugin('ULTRAVIOLET_VERSION'),
    ],
    performance: {
        // suppress "entrypoint size limit" warning
        hints: false,
    },
};

export default config;
