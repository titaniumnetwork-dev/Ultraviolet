import EventEmitter from 'events';
import HookEvent from '../hook.js';

/**
 * @typedef {import('../index').default} UVClient
 */

class AttrApi extends EventEmitter {
    /**
     *
     * @param {UVClient} ctx
     */
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.Attr = this.window.Attr || {};
        this.attrProto = this.Attr.prototype || {};
        this.value = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.attrProto,
            'value'
        );
        this.name = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.attrProto,
            'name'
        );
        this.getNamedItem = this.attrProto.getNamedItem || null;
        this.setNamedItem = this.attrProto.setNamedItem || null;
        this.removeNamedItem = this.attrProto.removeNamedItem || null;
        this.getNamedItemNS = this.attrProto.getNamedItemNS || null;
        this.setNamedItemNS = this.attrProto.setNamedItemNS || null;
        this.removeNamedItemNS = this.attrProto.removeNamedItemNS || null;
        this.item = this.attrProto.item || null;
    }
    overrideNameValue() {
        this.ctx.overrideDescriptor(this.attrProto, 'name', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('name', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
        });

        this.ctx.overrideDescriptor(this.attrProto, 'value', {
            get: (target, that) => {
                const event = new HookEvent(
                    {
                        name: this.name.get.call(that),
                        value: target.call(that),
                    },
                    target,
                    that
                );
                this.emit('getValue', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
            set: (target, that, [val]) => {
                const event = new HookEvent(
                    { name: this.name.get.call(that), value: val },
                    target,
                    that
                );
                this.emit('setValue', event);

                if (event.intercepted) return event.returnValue;
                event.target.call(event.that, event.data.value);
            },
        });
    }
    overrideItemMethods() {
        this.ctx.override(
            this.attrProto,
            'getNamedItem',
            (target, that, args) => {
                if (!args.length) return target.apply(that, args);
                let [name] = args;

                const event = new HookEvent({ name }, target, that);
                this.emit('getNamedItem', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(event.that, event.data.name);
            }
        );
        this.ctx.override(
            this.attrProto,
            'setNamedItem',
            (target, that, args) => {
                if (2 > args.length) return target.apply(that, args);
                let [name, value] = args;

                const event = new HookEvent({ name, value }, target, that);
                this.emit('setNamedItem', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(
                    event.that,
                    event.data.name,
                    event.data.value
                );
            }
        );
        this.ctx.override(
            this.attrProto,
            'removeNamedItem',
            (target, that, args) => {
                if (!args.length) return target.apply(that, args);
                let [name] = args;

                const event = new HookEvent({ name }, target, that);
                this.emit('removeNamedItem', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(event.that, event.data.name);
            }
        );
        this.ctx.override(this.attrProto, 'item', (target, that, args) => {
            if (!args.length) return target.apply(that, args);
            let [index] = args;

            const event = new HookEvent({ index }, target, that);
            this.emit('item', event);

            if (event.intercepted) return event.returnValue;
            return event.target.call(event.that, event.data.name);
        });
        this.ctx.override(
            this.attrProto,
            'getNamedItemNS',
            (target, that, args) => {
                if (2 > args.length) return target.apply(that, args);
                let [namespace, localName] = args;

                const event = new HookEvent(
                    { namespace, localName },
                    target,
                    that
                );
                this.emit('getNamedItemNS', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(
                    event.that,
                    event.data.namespace,
                    event.data.localName
                );
            }
        );
        this.ctx.override(
            this.attrProto,
            'setNamedItemNS',
            (target, that, args) => {
                if (!args.length) return target.apply(that, args);
                let [attr] = args;

                const event = new HookEvent({ attr }, target, that);
                this.emit('setNamedItemNS', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(event.that, event.data.name);
            }
        );
        this.ctx.override(
            this.attrProto,
            'removeNamedItemNS',
            (target, that, args) => {
                if (2 > args.length) return target.apply(that, args);
                let [namespace, localName] = args;

                const event = new HookEvent(
                    { namespace, localName },
                    target,
                    that
                );
                this.emit('removeNamedItemNS', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(
                    event.that,
                    event.data.namespace,
                    event.data.localName
                );
            }
        );
    }
}

export default AttrApi;
