
import EventEmitter from 'events';

class CSS extends EventEmitter {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.meta = ctx.meta;
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
        // no rewriting rn cry ab it
        return str;
    }
}

export default CSS;
