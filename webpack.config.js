import { fileURLToPath } from 'url';
import TerserPlugin from 'terser-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * @type {webpack.Configuration}
 */
const config = {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'eval' : 'source-map',
    entry: {
        bundle: fileURLToPath(
            new URL('./src/rewrite/index.js', import.meta.url)
        ),
        handler: fileURLToPath(new URL('./src/uv.handler.js', import.meta.url)),
        sw: fileURLToPath(new URL('./src/uv.sw.js', import.meta.url)),
    },
    output: {
        path: fileURLToPath(new URL('./dist/', import.meta.url)),
        filename: 'uv.[name].js',
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
    ],
    performance: {
        // suppress "entrypoint size limit" warning
        hints: false,
    },
};

export default config;
