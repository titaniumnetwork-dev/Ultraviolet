import { parse, walk, generate } from 'css-tree';
import EventEmitter from 'events';

class CSS extends EventEmitter {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.meta = ctx.meta;
        this.parse = parse;
        this.walk = walk;
        this.generate = generate;
    }
    rewrite(str, options) {
        return this.recast(str, options, 'rewrite');
    }
    source(str, options) {
        return this.recast(str, options, 'source');
    }
    recast(str, options, type) {
        if (!str) return str;
        str = new String(str).toString();
        try {
            const ast = this.parse(str, {
                ...options,
                parseCustomProperty: true,
            });
            this.walk(ast, (node) => {
                this.emit(node.type, node, options, type);
            });
            return this.generate(ast);
        } catch (e) {
            return str;
        }
    }
}

export default CSS;
