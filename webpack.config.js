import webpack from 'webpack';
import { fileURLToPath } from 'url';

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * @type {webpack.Configuration}
 */
const config = {
	mode: isDevelopment ? 'development' : 'production',
	entry: fileURLToPath(new URL('./rewrite/index.js', import.meta.url)),
	output: {
		path: fileURLToPath(new URL('./lib/', import.meta.url)),
		filename: 'uv.bundle.js',
	},
	performance: {
		// suppress "entrypoint size limit" warning
		hints: false,
	},
};

export default config;
