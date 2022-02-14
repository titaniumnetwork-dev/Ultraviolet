import Ultraviolet from './rewrite/index.js'

import { generate } from 'esotope-hammerhead';
import { parseScript } from 'meriyah';

const uv = new Ultraviolet({
    meta: {
        url: new URL('https://www.google.com'),
        base: new URL('https://www.google.com')
    }
});

/*
console.log(
    uv.css.recast('body { background: url  ( \n  "   coohcie  "  ) }')
)

*/

console.log(
    uv.rewriteJS('window.eval(saasdsd)')
)

/*
const used = process.memoryUsage().heapUsed / 1024 / 1024;
console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
*/