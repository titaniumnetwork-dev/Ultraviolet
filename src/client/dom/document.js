import EventEmitter from 'events';
import HookEvent from '../hook.js';

/**
 * @typedef {import('../index').default} UVClient
 */

class DocumentHook extends EventEmitter {
    /**
     *
     * @param {UVClient} ctx
     */
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.document = this.window.document;
        this.Document = this.window.Document || {};
        this.DOMParser = this.window.DOMParser || {};
        this.docProto = this.Document.prototype || {};
        this.domProto = this.DOMParser.prototype || {};
        this.title = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.docProto,
            'title'
        );
        this.cookie = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.docProto,
            'cookie'
        );
        this.referrer = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.docProto,
            'referrer'
        );
        this.domain = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.docProto,
            'domain'
        );
        this.documentURI = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.docProto,
            'documentURI'
        );
        this.write = this.docProto.write;
        this.writeln = this.docProto.writeln;
        this.querySelector = this.docProto.querySelector;
        this.querySelectorAll = this.docProto.querySelectorAll;
        this.parseFromString = this.domProto.parseFromString;
        this.URL = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.docProto,
            'URL'
        );
    }
    overrideParseFromString() {
        this.ctx.override(
            this.domProto,
            'parseFromString',
            (target, that, args) => {
                if (2 > args.length) return target.apply(that, args);
                let [string, type] = args;

                const event = new HookEvent({ string, type }, target, that);
                this.emit('parseFromString', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(
                    event.that,
                    event.data.string,
                    event.data.type
                );
            }
        );
    }
    overrideQuerySelector() {
        this.ctx.override(
            this.docProto,
            'querySelector',
            (target, that, args) => {
                if (!args.length) return target.apply(that, args);
                let [selectors] = args;

                const event = new HookEvent({ selectors }, target, that);
                this.emit('querySelector', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(event.that, event.data.selectors);
            }
        );
    }
    overrideDomain() {
        this.ctx.overrideDescriptor(this.docProto, 'domain', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('getDomain', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
            set: (target, that, [val]) => {
                const event = new HookEvent({ value: val }, target, that);
                this.emit('setDomain', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(event.that, event.data.value);
            },
        });
    }
    overrideReferrer() {
        this.ctx.overrideDescriptor(this.docProto, 'referrer', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('referrer', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
        });
    }
    overrideCreateTreeWalker() {
        this.ctx.override(
            this.docProto,
            'createTreeWalker',
            (target, that, args) => {
                if (!args.length) return target.apply(that, args);
                let [root, show = 0xffffffff, filter, expandEntityReferences] =
                    args;

                const event = new HookEvent(
                    { root, show, filter, expandEntityReferences },
                    target,
                    that
                );
                this.emit('createTreeWalker', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(
                    event.that,
                    event.data.root,
                    event.data.show,
                    event.data.filter,
                    event.data.expandEntityReferences
                );
            }
        );
    }
    overrideWrite() {
        this.ctx.override(this.docProto, 'write', (target, that, args) => {
            if (!args.length) return target.apply(that, args);
            let [...html] = args;

            const event = new HookEvent({ html }, target, that);
            this.emit('write', event);

            if (event.intercepted) return event.returnValue;
            return event.target.apply(event.that, event.data.html);
        });
        this.ctx.override(this.docProto, 'writeln', (target, that, args) => {
            if (!args.length) return target.apply(that, args);
            let [...html] = args;

            const event = new HookEvent({ html }, target, that);
            this.emit('writeln', event);

            if (event.intercepted) return event.returnValue;
            return event.target.apply(event.that, event.data.html);
        });
    }
    overrideDocumentURI() {
        this.ctx.overrideDescriptor(this.docProto, 'documentURI', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('documentURI', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
        });
    }
    overrideURL() {
        this.ctx.overrideDescriptor(this.docProto, 'URL', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('url', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
        });
    }
    overrideCookie() {
        this.ctx.overrideDescriptor(this.docProto, 'cookie', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('getCookie', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
            set: (target, that, [value]) => {
                const event = new HookEvent({ value }, target, that);
                this.emit('setCookie', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(event.that, event.data.value);
            },
        });
    }
    overrideTitle() {
        this.ctx.overrideDescriptor(this.docProto, 'title', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('getTitle', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
            set: (target, that, [value]) => {
                const event = new HookEvent({ value }, target, that);
                this.emit('setTitle', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(event.that, event.data.value);
            },
        });
    }
}

export default DocumentHook;
