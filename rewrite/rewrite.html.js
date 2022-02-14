function attributes(ctx, meta = ctx.meta) {
    const { html, js, css, attributePrefix } = ctx;
    const origPrefix = attributePrefix + '-attr-';

    html.on('attr', (attr, type) => {
        if (attr.node.tagName === 'base' && attr.name === 'href' && attr.options.document) {
            meta.base = new URL(attr.value, meta.url);
        };
        
        if (type === 'rewrite' && isUrl(attr.name, attr.tagName)) {
            attr.node.setAttribute(origPrefix + attr.name, attr.value);
            attr.value = ctx.rewriteUrl(attr.value, meta);
        };

        if (type === 'rewrite' && isSrcset(attr.name)) {
            attr.node.setAttribute(origPrefix + attr.name, attr.value);
            attr.value = html.wrapSrcset(attr.value, meta);
        };


        if (type === 'rewrite' && isHtml(attr.name)) {
            attr.node.setAttribute(origPrefix + attr.name, attr.value);
            attr.value = html.rewrite(attr.value, { ...meta, document: true });
        };

        
        if (type === 'rewrite' && isStyle(attr.name)) {
            attr.node.setAttribute(origPrefix + attr.name, attr.value);
            attr.value = ctx.rewriteCSS(attr.value, { context: 'declarationList', });
        };

        if (type === 'rewrite' && isForbidden(attr.name)) {
            attr.name = origPrefix + attr.name;
        };

        if (type === 'rewrite' && isEvent(attr.name)) {
            attr.node.setAttribute(origPrefix + attr.name, attr.value);
            attr.value = js.rewrite(attr.value, meta);
        };

        if (type === 'source' && attr.name.startsWith(origPrefix)) {
            if (attr.node.hasAttribute(attr.name.slice(origPrefix.length))) attr.node.removeAttribute(attr.name.slice(origPrefix.length));
            attr.name = attr.name.slice(origPrefix.length);
        };


        /*
        if (isHtml(attr.name)) {

        };

        if (isStyle(attr.name)) {

        };

        if (isSrcset(attr.name)) {

        };
        */
    });  

};


function text(ctx, meta = ctx.meta) {
    const { html, js, css, attributePrefix } = ctx;

    html.on('text', (text, type) => {
        if (text.element.tagName === 'script') {
            text.value = type === 'rewrite' ? js.rewrite(text.value) : js.source(text.value);
        };

        if (text.element.tagName === 'style') {
            text.value = type === 'rewrite' ? css.rewrite(text.value) : css.source(text.value);
        };
    });
    return true;
};

function isUrl(name, tag) {
    return tag === 'object' && name === 'data' || ['src', 'href', 'ping', 'movie', 'action', 'poster', 'profile', 'background'].indexOf(name) > -1;
};
function isEvent(name) {
    return [
        'onafterprint',
        'onbeforeprint',
        'onbeforeunload',
        'onerror',
        'onhashchange',
        'onload',
        'onmessage',
        'onoffline',
        'ononline',
        'onpagehide',
        'onpopstate',
        'onstorage',
        'onunload',
        'onblur',
        'onchange',
        'oncontextmenu',
        'onfocus',
        'oninput',
        'oninvalid',
        'onreset',
        'onsearch',
        'onselect',
        'onsubmit',
        'onkeydown',
        'onkeypress',
        'onkeyup',
        'onclick',
        'ondblclick',
        'onmousedown',
        'onmousemove',
        'onmouseout',
        'onmouseover',
        'onmouseup',
        'onmousewheel',
        'onwheel',
        'ondrag',
        'ondragend',
        'ondragenter',
        'ondragleave',
        'ondragover',
        'ondragstart',
        'ondrop',
        'onscroll',
        'oncopy',
        'oncut',
        'onpaste',
        'onabort',
        'oncanplay',
        'oncanplaythrough',
        'oncuechange',
        'ondurationchange',
        'onemptied',
        'onended',
        'onerror',
        'onloadeddata',
        'onloadedmetadata',
        'onloadstart',
        'onpause',
        'onplay',
        'onplaying',
        'onprogress',
        'onratechange',
        'onseeked',
        'onseeking',
        'onstalled',
        'onsuspend',
        'ontimeupdate',
        'onvolumechange',
        'onwaiting',
    ].indexOf(name) > -1;
};

function isForbidden(name) {
    return ['http-equiv', 'integrity', 'sandbox', 'nonce', 'crossorigin'].indexOf(name) > -1;
};

function isHtml(name){
    return name === 'srcdoc';
};

function isStyle(name) {
    return name === 'style';
};

function isSrcset(name) {
    return name === 'srcset' || name === 'imagesrcset';
};


export { attributes, text, isUrl, isEvent, isForbidden, isHtml, isStyle, isSrcset };