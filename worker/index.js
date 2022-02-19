import { RequestContext } from "./context";

class ServiceWorkerProxy extends EventTarget {
    constructor() {
        
    };
    static createRequest(options = {}) {
        return new RequestContext(options);
    };
};