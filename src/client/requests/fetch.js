import EventEmitter from 'events';
import HookEvent from '../hook.js';

/**
 * @typedef {import('../index').default} UVClient
 */

class Fetch extends EventEmitter {
    /**
     *
     * @param {UVClient} ctx
     */
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.fetch = this.window.fetch;
        this.Request = this.window.Request;
        this.Response = this.window.Response;
        this.Headers = this.window.Headers;
        this.reqProto = this.Request ? this.Request.prototype : {};
        this.resProto = this.Response ? this.Response.prototype : {};
        this.headersProto = this.Headers ? this.Headers.prototype : {};
        this.reqUrl = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.reqProto,
            'url'
        );
        this.resUrl = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.resProto,
            'url'
        );
        this.reqHeaders = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.reqProto,
            'headers'
        );
        this.resHeaders = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.resProto,
            'headers'
        );
    }
    override() {
        this.overrideRequest();
        this.overrideUrl();
        this.overrideHeaders();
        return true;
    }
    overrideRequest() {
        if (!this.fetch) return false;

        this.ctx.override(this.window, 'fetch', (target, that, args) => {
            if (!args.length || args[0] instanceof this.Request)
                return target.apply(that, args);

            let [input, options = {}] = args;
            const event = new HookEvent({ input, options }, target, that);

            this.emit('request', event);
            if (event.intercepted) return event.returnValue;

            return event.target.call(
                event.that,
                event.data.input,
                event.data.options
            );
        });

        this.ctx.override(
            this.window,
            'Request',
            (target, that, args) => {
                if (!args.length) return new target(...args);

                let [input, options = {}] = args;
                const event = new HookEvent({ input, options }, target);

                this.emit('request', event);
                if (event.intercepted) return event.returnValue;

                return new event.target(event.data.input, event.data.options);
            },
            true
        );
        return true;
    }
    overrideUrl() {
        this.ctx.overrideDescriptor(this.reqProto, 'url', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );

                this.emit('requestUrl', event);
                if (event.intercepted) return event.returnValue;

                return event.data.value;
            },
        });

        this.ctx.overrideDescriptor(this.resProto, 'url', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );

                this.emit('responseUrl', event);
                if (event.intercepted) return event.returnValue;

                return event.data.value;
            },
        });
        return true;
    }
    overrideHeaders() {
        if (!this.Headers) return false;

        this.ctx.overrideDescriptor(this.reqProto, 'headers', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );

                this.emit('requestHeaders', event);
                if (event.intercepted) return event.returnValue;

                return event.data.value;
            },
        });

        this.ctx.overrideDescriptor(this.resProto, 'headers', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );

                this.emit('responseHeaders', event);
                if (event.intercepted) return event.returnValue;

                return event.data.value;
            },
        });

        this.ctx.override(this.headersProto, 'get', (target, that, [name]) => {
            if (!name) return target.call(that);
            const event = new HookEvent(
                { name, value: target.call(that, name) },
                target,
                that
            );

            this.emit('getHeader', event);
            if (event.intercepted) return event.returnValue;

            return event.data.value;
        });

        this.ctx.override(this.headersProto, 'set', (target, that, args) => {
            if (2 > args.length) return target.apply(that, args);

            let [name, value] = args;
            const event = new HookEvent({ name, value }, target, that);

            this.emit('setHeader', event);
            if (event.intercepted) return event.returnValue;

            return event.target.call(
                event.that,
                event.data.name,
                event.data.value
            );
        });

        this.ctx.override(this.headersProto, 'has', (target, that, args) => {
            if (!args.length) return target.call(that);
            let [name] = args;

            const event = new HookEvent(
                { name, value: target.call(that, name) },
                target,
                that
            );

            this.emit('hasHeader', event);
            if (event.intercepted) return event.returnValue;

            return event.data;
        });

        this.ctx.override(this.headersProto, 'append', (target, that, args) => {
            if (2 > args.length) return target.apply(that, args);

            let [name, value] = args;
            const event = new HookEvent({ name, value }, target, that);

            this.emit('appendHeader', event);
            if (event.intercepted) return event.returnValue;

            return event.target.call(
                event.that,
                event.data.name,
                event.data.value
            );
        });

        this.ctx.override(this.headersProto, 'delete', (target, that, args) => {
            if (!args.length) return target.apply(that, args);

            let [name] = args;
            const event = new HookEvent({ name }, target, that);

            this.emit('deleteHeader', event);
            if (event.intercepted) return event.returnValue;

            return event.target.call(event.that, event.data.name);
        });

        return true;
    }
}

export default Fetch;
