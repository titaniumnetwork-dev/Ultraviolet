import { rimraf } from 'rimraf';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { build } from 'esbuild';

// read version from package.json
const pkg = JSON.parse(await readFile('package.json'));
process.env.ULTRAVIOLET_VERSION = pkg.version;

const isDevelopment = process.argv.includes('--dev');

await rimraf('dist');
await mkdir('dist');

// don't compile these files
await copyFile('src/sw.js', 'dist/sw.js');
await copyFile('src/uv.config.js', 'dist/uv.config.js');

await build({
    platform: 'browser',
    sourcemap: true,
    minify: !isDevelopment,
    entryPoints: {
        'uv.bundle': './src/rewrite/index.js',
        'uv.client': './src/client/index.js',
        'uv.handler': './src/uv.handler.js',
        'uv.sw': './src/uv.sw.js',
    },
    define: {
        'process.env.ULTRAVIOLET_VERSION': JSON.stringify(
            process.env.ULTRAVIOLET_VERSION
        ),
    },
    bundle: true,
    outdir: 'dist/',
});
