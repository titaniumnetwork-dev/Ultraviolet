
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
        // credit to (https://github.com/callumlocke/css-url-rewriter)
        const cssPropertyMatcher = /@import[^;]*|[;\s{]?\*?[a-zA-Z\-]+\s*:#?[\s\S]*url\(\s*['"]?[^'"\)\s]+['"]?\s*\)[^;}]*/g;
        const urlMatcher = /url\(\s*['"]?([^)'"]+)['"]?\s*\)/g;

        const settings = {
            excludeProperties: ['behavior', '*behavior']
          };

        str = str.toString().replace(cssPropertyMatcher, (property) => {
            // This function deals with an individual CSS property.

            // If this property is excluded, return it unchanged
            if (settings.excludeProperties.length) {
            const propertyName = property.split(':')[0].replace(/^\s+|\s+$/g, '');

                for (let i = settings.excludeProperties.length - 1; i >= 0; i--) {
                    if (propertyName.indexOf(settings.excludeProperties[i]) === 0) {
                        return property;
                    }
                }
            }

            // Return the property with the URL rewritten
            return property.replace(urlMatcher, (urlFunc, url) => {
                return urlFunc.replace(url, type === "rewrite" ? this.ctx.rewriteUrl(url) : this.ctx.sourceUrl(url));
            });
        });

        return str;
    }
}

export default CSS;
