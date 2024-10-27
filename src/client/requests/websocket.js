import EventEmitter from "events";
import HookEvent from "../hook.js";

/**
 * @typedef {import('../index').default} UVClient
 */

class WebSocketApi extends EventEmitter {
	/**
	 *
	 * @param {UVClient} ctx
	 */
	constructor(ctx) {
		super();
		this.ctx = ctx;
		this.window = ctx.window;
		this.WebSocket = this.window.WebSocket || {};
		this.wsProto = this.WebSocket.prototype;
		this.CONNECTING = WebSocket.CONNECTING;
		this.OPEN = WebSocket.OPEN;
		this.CLOSING = WebSocket.CLOSING;
		this.CLOSED = WebSocket.CLOSED;
		this.socketmap = new WeakMap();
	}
	overrideWebSocket(client) {
		this.ctx.override(
			this.window,
			"WebSocket",
			(target, that, args) => {
				const fakeWebSocket = new EventTarget();
				Object.setPrototypeOf(fakeWebSocket, this.WebSocket.prototype);
				fakeWebSocket.constructor = this.WebSocket;

				const trustEvent = (ev) =>
					new Proxy(ev, {
						get(target, prop) {
							if (prop === "isTrusted") return true;

							return Reflect.get(target, prop);
						},
					});

				const barews = client.createWebSocket(args[0], args[1], null, {
					"User-Agent": navigator.userAgent,
					Origin: __uv.meta.url.origin,
				});

				const state = {
					extensions: "",
					protocol: "",
					url: args[0],
					binaryType: "blob",
					barews,
				};

				function fakeEventSend(fakeev) {
					state["on" + fakeev.type]?.(trustEvent(fakeev));
					fakeWebSocket.dispatchEvent(fakeev);
				}

				barews.addEventListener("open", () => {
					fakeEventSend(new Event("open"));
				});
				barews.addEventListener("close", (ev) => {
					fakeEventSend(new CloseEvent("close", ev));
				});
				barews.addEventListener("message", async (ev) => {
					let payload = ev.data;
					if (typeof payload === "string") {
						// DO NOTHING
					} else if ("byteLength" in payload) {
						// arraybuffer, convert to blob if needed or set the proper prototype
						if (state.binaryType === "blob") {
							payload = new Blob([payload]);
						} else {
							Object.setPrototypeOf(payload, ArrayBuffer.prototype);
						}
					} else if ("arrayBuffer" in payload) {
						// blob, convert to arraybuffer if neccesary.
						if (state.binaryType === "arraybuffer") {
							payload = await payload.arrayBuffer();
							Object.setPrototypeOf(payload, ArrayBuffer.prototype);
						}
					}
					const fakeev = new MessageEvent("message", {
						data: payload,
						origin: ev.origin,
						lastEventId: ev.lastEventId,
						source: ev.source,
						ports: ev.ports,
					});

					fakeEventSend(fakeev);
				});
				barews.addEventListener("error", () => {
					fakeEventSend(new Event("error"));
				});

				this.socketmap.set(fakeWebSocket, state);
				return fakeWebSocket;
			},
			true
		);

		this.ctx.overrideDescriptor(this.wsProto, "binaryType", {
			get: (target, that) => {
				const ws = this.socketmap.get(that);

				return ws.binaryType;
			},
			set: (target, that, value) => {
				const ws = this.socketmap.get(that);
				if (value[0] === "blob" || value[0] === "arraybuffer")
					ws.binaryType = value[0];
			},
		});

		this.ctx.overrideDescriptor(this.wsProto, "bufferedAmount", {
			get: (target, that) => {
				return 0;
			},
		});

		this.ctx.overrideDescriptor(this.wsProto, "extensions", {
			get: (target, that) => {
				const ws = this.socketmap.get(that); // get the WebSocket from socketmap

				return ws.extensions;
			},
		});

		this.ctx.overrideDescriptor(this.wsProto, "onclose", {
			get: (target, that) => {
				const ws = this.socketmap.get(that);

				return ws.onclose;
			},
			set: (target, that, value) => {
				const ws = this.socketmap.get(that);

				ws.onclose = value[0];
			},
		});

		this.ctx.overrideDescriptor(this.wsProto, "onerror", {
			get: (target, that) => {
				const ws = this.socketmap.get(that);

				return ws.onerror;
			},
			set: (target, that, value) => {
				const ws = this.socketmap.get(that);

				ws.onerror = value[0];
			},
		});

		this.ctx.overrideDescriptor(this.wsProto, "onmessage", {
			get: (target, that) => {
				const ws = this.socketmap.get(that);

				return ws.onmessage;
			},
			set: (target, that, value) => {
				const ws = this.socketmap.get(that);

				ws.onmessage = value[0];
			},
		});

		this.ctx.overrideDescriptor(this.wsProto, "onopen", {
			get: (target, that) => {
				const ws = this.socketmap.get(that);

				return ws.onopen;
			},
			set: (target, that, value) => {
				const ws = this.socketmap.get(that);

				ws.onopen = value[0];
			},
		});

		this.ctx.overrideDescriptor(this.wsProto, "url", {
			get: (target, that) => {
				const ws = this.socketmap.get(that);

				return ws.url;
			},
		});

		this.ctx.overrideDescriptor(this.wsProto, "protocol", {
			get: (target, that) => {
				const ws = this.socketmap.get(that);

				return ws.protocol;
			},
		});

		this.ctx.overrideDescriptor(this.wsProto, "readyState", {
			get: (target, that) => {
				const ws = this.socketmap.get(that);

				return ws.barews.readyState;
			},
		});

		this.ctx.override(
			this.wsProto,
			"send",
			(target, that, args) => {
				const ws = this.socketmap.get(that);

				return ws.barews.send(args[0]);
			},
			false
		);
		this.ctx.override(
			this.wsProto,
			"close",
			(target, that, args) => {
				const ws = this.socketmap.get(that);
				if (args[0] === undefined) args[0] = 1000;
				if (args[1] === undefined) args[1] = "";
				return ws.barews.close(args[0], args[1]);
			},
			false
		);
	}
}

export default WebSocketApi;
