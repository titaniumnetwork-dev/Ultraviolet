import EventEmitter from 'events';
import HookEvent from './hook.js';

/**
 * @typedef {import('./index').default} Ultraviolet
 */

class IDBApi extends EventEmitter {
    /**
     *
     * @param {Ultraviolet} ctx
     */
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = this.ctx.window;
        this.IDBDatabase = this.window.IDBDatabase || {};
        this.idbDatabaseProto = this.IDBDatabase.prototype || {};
        this.IDBFactory = this.window.IDBFactory || {};
        this.idbFactoryProto = this.IDBFactory.prototype || {};
        this.open = this.idbFactoryProto.open;
    }
    overrideOpen() {
        this.ctx.override(
            this.IDBFactory.prototype,
            'open',
            (target, that, args) => {
                if (!args.length) return target.apply(that, args);

                if (!args.length) return target.apply(that, args);
                const [name, version] = args;

                const event = new HookEvent({ name, version }, target, that);
                this.emit('idbFactoryOpen', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(
                    event.that,
                    event.data.name,
                    event.data.version
                );
            }
        );
    }
    overrideName() {
        this.ctx.overrideDescriptor(this.idbDatabaseProto, 'name', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('idbFactoryName', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
        });
    }
}

export default IDBApi;
