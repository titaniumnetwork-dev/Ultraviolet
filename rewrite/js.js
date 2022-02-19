import { parseScript } from 'meriyah';
// import { parse } from 'acorn-hammerhead';
import { generate } from 'esotope-hammerhead';
import EventEmitter from './events.js';

class JS extends EventEmitter {
    constructor() {
        super();
        /*
        this.parseOptions = { 
            allowReturnOutsideFunction: true, 
            allowImportExportEverywhere: true, 
            ecmaVersion: 2021, 
        };
        */
        this.parseOptions = {
            ranges: true,
            module: true,
            globalReturn: true,
        };
        this.generationOptions = {
            format: {
                quotes: 'double',
                escapeless: true,
                compact: true,
            },
        };
        this.parse = parseScript /*parse*/;
        this.generate = generate;
    };  
    rewrite(str, data = {}) {
        return this.recast(str, data, 'rewrite');
    };
    source(str, data = {}) {
        return this.recast(str, data, 'source');
    };
    recast(str, data = {}, type = '') {
        try {
            const output = [];
            const ast = this.parse(str, this.parseOptions);
            const meta = {
                data,
                changes: [],
                input: str,
                ast,
                get slice() {
                    return slice;
                },
            };
            let slice = 0;

            this.iterate(ast, (node, parent = null) => {
                if (parent && parent.inTransformer) node.isTransformer = true;
                node.parent = parent;

                this.emit(node.type, node, meta, type);
            });

            meta.changes.sort((a, b) => (a.start - b.start) || (a.end - b.end));

            for (const change of meta.changes) {
                if ('start' in change && typeof change.start === 'number') output.push(str.slice(slice, change.start));
                if (change.node) output.push(typeof change.node === 'string' ? change.node : generate(change.node, this.generationOptions));
                if ('end' in change && typeof change.end === 'number') slice = change.end;
            };
            output.push(str.slice(slice));
            return output.join('');
        } catch(e) {
            return str;
        };
    };
    iterate(ast, handler) {
        if (typeof ast != 'object' || !handler) return;
        walk(ast, null, handler);
        function walk(node, parent, handler) {
            if (typeof node != 'object' || !handler) return;
            handler(node, parent, handler);
            for (const child in node) {
                if (child === 'parent') continue;
                if (Array.isArray(node[child])) {
                    node[child].forEach(entry => { 
                        if (entry) walk(entry, node, handler)
                    });
                } else {
                    if (node[child]) walk(node[child], node, handler);
                };
            };
            if (typeof node.iterateEnd === 'function') node.iterateEnd();
        };
    };
};

export default JS;