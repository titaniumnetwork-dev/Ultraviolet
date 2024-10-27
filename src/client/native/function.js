import EventEmitter from "events";
import HookEvent from "../hook.js";

/**
 * @typedef {import('../index').default} UVClient
 */

class FunctionHook extends EventEmitter {
	/**
	 *
	 * @param {UVClient} ctx
	 */
	constructor(ctx) {
		super();
		this.ctx = ctx;
		this.window = ctx.window;
		this.Function = this.window.Function;
		this.fnProto = this.Function.prototype;
		this.toString = this.fnProto.toString;
		this.fnStrings = ctx.fnStrings;
		this.call = this.fnProto.call;
		this.apply = this.fnProto.apply;
		this.bind = this.fnProto.bind;
	}
	overrideFunction() {
		this.ctx.override(
			this.window,
			"Function",
			(target, that, args) => {
				if (!args.length) return target.apply(that, args);

				let script = args[args.length - 1];
				let fnArgs = [];

				for (let i = 0; i < args.length - 1; i++) {
					fnArgs.push(args[i]);
				}

				const event = new HookEvent({ script, args: fnArgs }, target, that);
				this.emit("function", event);

				if (event.intercepted) return event.returnValue;
				return event.target.call(
					event.that,
					...event.data.args,
					event.data.script
				);
			},
			true
		);
	}
	overrideToString() {
		this.ctx.override(this.fnProto, "toString", (target, that) => {
			const event = new HookEvent({ fn: that }, target, that);
			this.emit("toString", event);

			if (event.intercepted) return event.returnValue;
			return event.target.call(event.data.fn);
		});
	}
}

export default FunctionHook;
