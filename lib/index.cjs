import { fileURLToPath } from 'url';

const uvPath = fileURLToPath(new URL('../dist/', import.meta.url));

module.exports = uvPath;
