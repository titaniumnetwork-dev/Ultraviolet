import EventEmitter from "../events.js";
import parsel from "../parsel.js";


class CSS extends EventEmitter {
    constructor(ctx) {
        super();
        this.regex = /(?<url>\burl\()|(?<import>@import\b)|(?<parathesis>[\(\)])|(?<trailingEscape>\\*)?(?<quote>['"])|(?<comment>\/\*|\*\/)/g; 
        this.ctx = ctx;
        this.meta = ctx.meta;
        this.parsel = parsel;
    };
    rewrite(str, options = this.meta) {
        return this.rewriteChunk(str, options, {}, 'rewrite').output.join("");
    };
    rewriteSelector(str, attributes = [], list = true, prefix = '__op-attr-') {
        if (!str) return str;
    
        try {
            if (list) {
                const selectors = str.split(/(\s*$),(\s*$)/);
                const processed = [];
        
        
                for (const selector of selectors) {
                    processed.push(
                        this.rewriteSelector(selector, attributes, false, prefix)
                    )
                };
        
                return processed.join(', ');
            };
            let slice = 0;
            const output = [];
            const tokens = this.parsel.tokenize(str)
    
            for (const token of tokens) {
                if (token.type !== 'attribute') continue;
            
            
                const [ start ] = token.pos;
                const end = start + token.content.length;
            
                if (attributes.includes(token.name)) {
                    output.push(
                        str.slice(slice, start)
                    );
                
                    output.push(
                        token.content.replace(token.name, prefix + token.name)
                    );
                
                    slice = end;
                };
            };
            
            output.push(
                str.slice(slice)
            );
    
            return output.join('');
        } catch(e) {
            return str;
        };
    };
    rewriteChunk(chunk, options = this.meta, state = {}, type = 'rewrite') {
        const regex = new RegExp(this.regex);
        state.string ||= false;
        state.quote ||= '';
        state.previous ||= null;
        state.url ||= false;
        state.urlContent ||= '';
        state.rewriteString ||= false;
        state.comment ||= false;
        state.stringContent ||= '';

        const output = [];
        let loc = 0;
        let cutoff = chunk.length;
        let match = null;

        if (state.string || state.url) cutoff = 0;

        while ((match = regex.exec(chunk)) !== null) {    
            const {
                url,
                parathesis,
                quote,
                trailingEscape,
                comment,
            } = match.groups;

            if (state.comment) {
                if (comment === '*/') {
                    state.comment = false;
                }
                continue;
            };

            if (comment === '/*') {
                state.comment = true;
                continue;
            };

            if (state.string) {
                if (quote) {
                    if (state.quote === quote) {
                        // Checks for backslashes that can escape the quote.
                        // Also checking for backslashes that can escape the backslash behind the quote. Unlikely to happen, but still possible.
                        if (trailingEscape && trailingEscape.length & 1) continue;

                        if (state.rewriteString) {
                            const string = state.stringContent + chunk.slice(cutoff, match.index);
                            
                            output.push(
                                chunk.slice(loc, cutoff)
                            );

                            const url = new URLEvent(string, state, options, type);
                            this.emit('url', url);
                                
                            output.push(
                                url.value
                            );

                            output.push(quote);

                            loc = regex.lastIndex;
                            cutoff = chunk.length;

                            chunk.slice(loc, cutoff);

                            state.rewriteString = false;
                        };

                    state.quote = '';
                    state.string = false;
                    state.stringContent = '';
                };
            };
            continue;
        };

        if (quote) {
            state.string = true;
            state.quote = quote;
            
            if (state.previous && state.previous.groups.import) {
                state.rewriteString = true;
                cutoff = regex.lastIndex;
            };
        };

        if (state.url && parathesis === ')' && !state.string) {
            const string = (state.urlContent + chunk.slice(cutoff, match.index)).trim();
                        
            output.push(
                chunk.slice(loc, cutoff)
            );
            
            if ((string[0] === '"' || string[0] === "'") && string[0] === string[string.length - 1]) {
                output.push(string[0]);

                const url = new URLEvent(string.slice(1, string.length - 1), state, options, type);
                this.emit('url', url);

                output.push(
                    url.value
                );

                output.push(string[0]);
            } else {
                const url = new URLEvent(string, state, options, type);
                this.emit('url', url);

                output.push(
                    url.value,
                );
            };

            output.push(parathesis);

            loc = regex.lastIndex;
            cutoff = chunk.length;

            chunk.slice(loc, cutoff);

            state.urlContent = '';
            state.url = false;
            };

            if (state.url) {
                continue;
            };

            if (url) {
                state.url = true;
                cutoff = regex.lastIndex;
            };

            state.previous = match;
        };
    
        if (state.string) {
            state.stringContent += chunk.slice(cutoff);
        };

        if (state.url) {   
            state.urlContent += chunk.slice(cutoff);
        };

        output.push(
            chunk.slice(loc, cutoff)
        );

        return { output, state };
    };
};

class URLEvent {
    constructor(value, state = {}, options = {}, type = 'rewrite') {
        this.value = value;
        this.state = state;
        this.options = options;
        this.type = type;
    };
};

export default CSS;