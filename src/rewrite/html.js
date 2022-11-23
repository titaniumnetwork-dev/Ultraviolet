import EventEmitter from 'events';
import { parse, parseFragment, serialize } from 'parse5';

/**
 * @typedef {import('./index').default} Ultraviolet
 */

class HTML extends EventEmitter {
    /**
     *
     * @param {Ultraviolet} ctx
     */
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.rewriteUrl = ctx.rewriteUrl;
        this.sourceUrl = ctx.sourceUrl;
    }
    rewrite(str, options = {}) {
        if (!str) return str;
        return this.recast(
            str,
            (node) => {
                if (node.tagName) this.emit('element', node, 'rewrite');
                if (node.attr) this.emit('attr', node, 'rewrite');
                if (node.nodeName === '#text')
                    this.emit('text', node, 'rewrite');
            },
            options
        );
    }
    source(str, options = {}) {
        if (!str) return str;
        return this.recast(
            str,
            (node) => {
                if (node.tagName) this.emit('element', node, 'source');
                if (node.attr) this.emit('attr', node, 'source');
                if (node.nodeName === '#text')
                    this.emit('text', node, 'source');
            },
            options
        );
    }
    recast(str, fn, options = {}) {
        try {
            const ast = (options.document ? parse : parseFragment)(
                new String(str).toString()
            );
            this.iterate(ast, fn, options);
            return serialize(ast);
        } catch (e) {
            return str;
        }
    }
    iterate(ast, fn, fnOptions) {
        if (!ast) return ast;

        if (ast.tagName) {
            const element = new P5Element(ast, false, fnOptions);
            fn(element);
            if (ast.attrs) {
                for (const attr of ast.attrs) {
                    if (!attr.skip)
                        fn(new AttributeEvent(element, attr, fnOptions));
                }
            }
        }

        if (ast.childNodes) {
            for (const child of ast.childNodes) {
                if (!child.skip) this.iterate(child, fn, fnOptions);
            }
        }

        if (ast.nodeName === '#text') {
            fn(
                new TextEvent(
                    ast,
                    new P5Element(ast.parentNode),
                    false,
                    fnOptions
                )
            );
        }

        return ast;
    }
    wrapSrcset(str, meta = this.ctx.meta) {
        return str
            .split(',')
            .map((src) => {
                const parts = src.trimStart().split(' ');
                if (parts[0]) parts[0] = this.ctx.rewriteUrl(parts[0], meta);
                return parts.join(' ');
            })
            .join(', ');
    }
    unwrapSrcset(str, meta = this.ctx.meta) {
        return str
            .split(',')
            .map((src) => {
                const parts = src.trimStart().split(' ');
                if (parts[0]) parts[0] = this.ctx.sourceUrl(parts[0], meta);
                return parts.join(' ');
            })
            .join(', ');
    }
    static parse = parse;
    static parseFragment = parseFragment;
    static serialize = serialize;
}

class P5Element extends EventEmitter {
    constructor(node, stream = false, options = {}) {
        super();
        this.stream = stream;
        this.node = node;
        this.options = options;
    }
    setAttribute(name, value) {
        for (const attr of this.attrs) {
            if (attr.name === name) {
                attr.value = value;
                return true;
            }
        }

        this.attrs.push({
            name,
            value,
        });
    }
    getAttribute(name) {
        const attr = this.attrs.find((attr) => attr.name === name) || {};
        return attr.value;
    }
    hasAttribute(name) {
        return !!this.attrs.find((attr) => attr.name === name);
    }
    removeAttribute(name) {
        const i = this.attrs.findIndex((attr) => attr.name === name);
        if (typeof i !== 'undefined') this.attrs.splice(i, 1);
    }
    get tagName() {
        return this.node.tagName;
    }
    set tagName(val) {
        this.node.tagName = val;
    }
    get childNodes() {
        return !this.stream ? this.node.childNodes : null;
    }
    get innerHTML() {
        return !this.stream
            ? serialize({
                  nodeName: '#document-fragment',
                  childNodes: this.childNodes,
              })
            : null;
    }
    set innerHTML(val) {
        if (!this.stream) this.node.childNodes = parseFragment(val).childNodes;
    }
    get outerHTML() {
        return !this.stream
            ? serialize({
                  nodeName: '#document-fragment',
                  childNodes: [this],
              })
            : null;
    }
    set outerHTML(val) {
        if (!this.stream)
            this.parentNode.childNodes.splice(
                this.parentNode.childNodes.findIndex(
                    (node) => node === this.node
                ),
                1,
                ...parseFragment(val).childNodes
            );
    }
    get textContent() {
        if (this.stream) return null;

        let str = '';
        this.iterate(this.node, (node) => {
            if (node.nodeName === '#text') str += node.value;
        });

        return str;
    }
    set textContent(val) {
        if (!this.stream)
            this.node.childNodes = [
                {
                    nodeName: '#text',
                    value: val,
                    parentNode: this.node,
                },
            ];
    }
    get nodeName() {
        return this.node.nodeName;
    }
    get parentNode() {
        return this.node.parentNode
            ? new P5Element(this.node.parentNode)
            : null;
    }
    get attrs() {
        return this.node.attrs;
    }
    get namespaceURI() {
        return this.node.namespaceURI;
    }
}

class AttributeEvent {
    constructor(node, attr, options = {}) {
        this.attr = attr;
        this.attrs = node.attrs;
        this.node = node;
        this.options = options;
    }
    delete() {
        const i = this.attrs.findIndex((attr) => attr === this.attr);

        this.attrs.splice(i, 1);

        Object.defineProperty(this, 'deleted', {
            get: () => true,
        });

        return true;
    }
    get name() {
        return this.attr.name;
    }

    set name(val) {
        this.attr.name = val;
    }
    get value() {
        return this.attr.value;
    }

    set value(val) {
        this.attr.value = val;
    }
    get deleted() {
        return false;
    }
}

class TextEvent {
    constructor(node, element, stream = false, options = {}) {
        this.stream = stream;
        this.node = node;
        this.element = element;
        this.options = options;
    }
    get nodeName() {
        return this.node.nodeName;
    }
    get parentNode() {
        return this.element;
    }
    get value() {
        return this.stream ? this.node.text : this.node.value;
    }
    set value(val) {
        if (this.stream) this.node.text = val;
        else this.node.value = val;
    }
}

export default HTML;
