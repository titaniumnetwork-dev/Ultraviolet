import EventEmitter from "../events.js";
import HookEvent from "../hook.js";

class AttrApi extends EventEmitter {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.Attr = this.window.Attr || {};
        this.attrProto = this.Attr.prototype || {};
        this.value = ctx.nativeMethods.getOwnPropertyDescriptor(this.attrProto, 'value');
        this.name = ctx.nativeMethods.getOwnPropertyDescriptor(this.attrProto, 'name');
    };
    override() {
        this.ctx.overrideDescriptor(this.attrProto, 'name', {
            get: (target, that) => {
                const event = new HookEvent({ value: target.call(that) }, target, that);
                this.emit('name', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
        });
        
        this.ctx.overrideDescriptor(this.attrProto, 'value', {
            get: (target, that) => {
                const event = new HookEvent({ name: this.name.get.call(that), value: target.call(that) }, target, that);
                this.emit('getValue', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
            set: (target, that, [ val ]) => {
                const event = new HookEvent({ name: this.name.get.call(that), value: val }, target, that);
                this.emit('setValue', event);

                if (event.intercepted) return event.returnValue;
                event.target.call(event.that, event.data.value);
            }
        });
    };
};

export default AttrApi;