import EventEmitter from "events";
import HookEvent from "./hook.js";

/**
 * @typedef {import('./index').default} UVClient
 */

class History extends EventEmitter {
	/**
	 *
	 * @param {UVClient} ctx
	 */
	constructor(ctx) {
		super();
		this.ctx = ctx;
		this.window = this.ctx.window;
		this.History = this.window.History;
		this.history = this.window.history;
		this.historyProto = this.History ? this.History.prototype : {};
		this.pushState = this.historyProto.pushState;
		this.replaceState = this.historyProto.replaceState;
		this.go = this.historyProto.go;
		this.back = this.historyProto.back;
		this.forward = this.historyProto.forward;
	}
	override() {
		this.overridePushState();
		this.overrideReplaceState();
		this.overrideGo();
		this.overrideForward();
		this.overrideBack();
	}
	overridePushState() {
		this.ctx.override(this.historyProto, "pushState", (target, that, args) => {
			if (2 > args.length) return target.apply(that, args);
			let [state, title, url = ""] = args;

			const event = new HookEvent({ state, title, url }, target, that);
			this.emit("pushState", event);

			if (event.intercepted) return event.returnValue;
			return event.target.call(
				event.that,
				event.data.state,
				event.data.title,
				event.data.url
			);
		});
	}
	overrideReplaceState() {
		this.ctx.override(
			this.historyProto,
			"replaceState",
			(target, that, args) => {
				if (2 > args.length) return target.apply(that, args);
				let [state, title, url = ""] = args;

				const event = new HookEvent({ state, title, url }, target, that);
				this.emit("replaceState", event);

				if (event.intercepted) return event.returnValue;
				return event.target.call(
					event.that,
					event.data.state,
					event.data.title,
					event.data.url
				);
			}
		);
	}
	overrideGo() {
		this.ctx.override(this.historyProto, "go", (target, that, [delta]) => {
			const event = new HookEvent({ delta }, target, that);
			this.emit("go", event);

			if (event.intercepted) return event.returnValue;
			return event.target.call(event.that, event.data.delta);
		});
	}
	overrideForward() {
		this.ctx.override(this.historyProto, "forward", (target, that) => {
			const event = new HookEvent(null, target, that);
			this.emit("forward", event);

			if (event.intercepted) return event.returnValue;
			return event.target.call(event.that);
		});
	}
	overrideBack() {
		this.ctx.override(this.historyProto, "back", (target, that) => {
			const event = new HookEvent(null, target, that);
			this.emit("back", event);

			if (event.intercepted) return event.returnValue;
			return event.target.call(event.that);
		});
	}
}

export default History;
