import { fileURLToPath } from 'url';

export const uvPath = fileURLToPath(new URL('../dist/', import.meta.url));
