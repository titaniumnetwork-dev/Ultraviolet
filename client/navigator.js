import EventEmitter from "./events.js";
import HookEvent from "./hook.js";

class NavigatorApi extends EventEmitter {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.navigator = this.window.navigator;
        this.Navigator = this.window.Navigator || {};
        this.navProto = this.Navigator.prototype || {};
        this.sendBeacon = this.navProto.sendBeacon;
    };
    overrideSendBeacon() {
        this.ctx.override(this.navProto, 'sendBeacon', (target, that, args) => {
            if (!args.length) return target.apply(that, args);
            let [ url, data = '' ] = args;

            const event = new HookEvent({ url, data }, target, that);
            this.emit('sendBeacon', event);

            if (event.intercepted) return event.returnValue;
            return event.target.call(event.that, event.data.url, event.data.data);
        });
    };
};

export default NavigatorApi;