
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
        // CSS Rewriting from Meteor (https://github.com/meteorproxy/meteor)
        const regex =
        /(@import\s+(?!url\())?\s*url\(\s*(['"]?)([^'")]+)\2\s*\)|@import\s+(['"])([^'"]+)\4/g

        if (!str) return str;
        str = new String(str).toString();
        return str.replace(
            regex,
            (
                match,
                importStatement,
                urlQuote,
                urlContent,
                importQuote,
                importContent
            ) => {
                const url = urlContent || importContent
                const encodedUrl = type === "rewrite" ? this.ctx.rewriteUrl(url) : this.ctx.sourceUrl(url);
    
                if (importStatement) {
                    return `@import url(${urlQuote}${encodedUrl}${urlQuote})`
                }
    
                if (importQuote) {
                    return `@import ${importQuote}${encodedUrl}${importQuote}`
                }
    
                return `url(${urlQuote}${encodedUrl}${urlQuote})`
        });
    }
}

export default CSS;
