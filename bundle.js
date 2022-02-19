import webpack from "webpack";
import path from "path";

const __dirname = path.resolve(path.dirname(decodeURI(new URL(import.meta.url).pathname))).slice(3);

console.log(path.resolve(path.dirname(decodeURI(new URL(import.meta.url).pathname))), __dirname);

webpack({
    mode: 'none',
    entry: path.join(__dirname, './rewrite/index.js'),
    output: {
        path: __dirname,
        filename: './lib/uv.bundle.js',
    }
}, (err, i) => 
    console.log(!err ? 'Ultraviolet bundled!' : e)
);