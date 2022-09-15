import DocumentHook from "./dom/document.js";
import ElementApi from "./dom/element.js";
import NodeApi from "./dom/node.js";
import AttrApi from "./dom/attr.js";
import FunctionHook from "./native/function.js";
import ObjectHook from "./native/object.js";
import Fetch from "./requests/fetch.js";
import WebSocketApi from "./requests/websocket.js";
import Xhr from "./requests/xhr.js";
import EventSourceApi from "./requests/eventsource.js";
import History from "./history.js";
import LocationApi from "./location.js";
import MessageApi from "./message.js";
import NavigatorApi from "./navigator.js";
import Workers from "./worker.js";
import URLApi from "./url.js";
import EventEmitter from "./events.js";
import StorageApi from "./storage.js";
import StyleApi from "./dom/style.js";

class UVClient extends EventEmitter {
    constructor(window = self, worker = !window.window) {
        super();
        this.window = window;
        this.nativeMethods = {
            fnToString: this.window.Function.prototype.toString,
            defineProperty: this.window.Object.defineProperty,
            getOwnPropertyDescriptor: this.window.Object.getOwnPropertyDescriptor,
            getOwnPropertyDescriptors: this.window.Object.getOwnPropertyDescriptors,
            getOwnPropertyNames: this.window.Object.getOwnPropertyNames,
            keys: this.window.Object.keys,
            getOwnPropertySymbols: this.window.Object.getOwnPropertySymbols,
            isArray: this.window.Array.isArray,
            setPrototypeOf: this.window.Object.setPrototypeOf,
            isExtensible: this.window.Object.isExtensible,
            Map: this.window.Map,
            Proxy: this.window.Proxy,
        };
        this.worker = worker;
        this.fetch = new Fetch(this);
        this.xhr = new Xhr(this);
        this.history = new History(this);
        this.element = new ElementApi(this);
        this.node = new NodeApi(this)
        this.document = new DocumentHook(this);
        this.function = new FunctionHook(this);
        this.object = new ObjectHook(this);
        this.message = new MessageApi(this);
        this.websocket = new WebSocketApi(this);
        this.navigator = new NavigatorApi(this);
        this.eventSource = new EventSourceApi(this);
        this.attribute = new AttrApi(this);
        this.url = new URLApi(this);
        this.workers = new Workers(this);
        this.location = new LocationApi(this);
        this.storage = new StorageApi(this);
        this.style = new StyleApi(this);
    };
    initLocation(rewriteUrl, sourceUrl) {
        this.location = new LocationApi(this, sourceUrl, rewriteUrl, this.worker);
    };
    override(obj, prop, wrapper, construct) {
        if (!prop in obj) return false;
        const wrapped = this.wrap(obj, prop, wrapper, construct);
        return obj[prop] = wrapped;
    };
    overrideDescriptor(obj, prop, wrapObj = {}) {
        const wrapped = this.wrapDescriptor(obj, prop, wrapObj);
        if (!wrapped) return {};
        this.nativeMethods.defineProperty(obj, prop, wrapped);
        return wrapped;
    };
    wrap(obj, prop, wrap, construct) {
        const fn = obj[prop];
        if (!fn) return fn;
        const wrapped = 'prototype' in fn ? function attach() {
            return wrap(fn, this, [...arguments]);
        } : {
            attach() {
                return wrap(fn, this, [...arguments]);
          },
        }.attach;

        if (!!construct) {
            wrapped.prototype = fn.prototype;
            wrapped.prototype.constructor = wrapped; 
        };

        this.emit('wrap', fn, wrapped, !!construct);

        return wrapped;
    };
    wrapDescriptor(obj, prop, wrapObj = {}) {
        const descriptor = this.nativeMethods.getOwnPropertyDescriptor(obj, prop);
        if (!descriptor) return false;
        for (let key in wrapObj) {
            if (key in descriptor) {
                if (key === 'get' || key === 'set') {
                    descriptor[key] = this.wrap(descriptor, key, wrapObj[key]);
                } else {
                    descriptor[key] = typeof wrapObj[key] == 'function' ? wrapObj[key](descriptor[key]) : wrapObj[key];
                };
            }
        };
        return descriptor;
    };
};

export default UVClient;
if (typeof self === 'object') self.UVClient = UVClient;