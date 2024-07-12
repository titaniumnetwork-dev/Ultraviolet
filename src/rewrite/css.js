
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
        str = str.replace(/(?<=url\("?'?)[^"'][\S]*[^"'](?="?'?\);?)/gm, (match) => {
            return type === "rewrite" ? this.ctx.rewriteUrl(match) : this.ctx.sourceUrl(match);
        });
        str = str.replace(/@import\s+(['"])?([^'"\);]+)\1?\s*(?:;|$)/gm, (match, quote, url) => {
            return `@import ${quote || ""}${type === "rewrite" ? this.ctx.rewriteUrl(url) : this.ctx.sourceUrl(url)}${quote || ""};`;
        });
        return str;
    }
}

export default CSS;
