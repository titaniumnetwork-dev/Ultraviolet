class RequestContext {
    constructor(ctx = {}) {
        this.url = ctx.url || '';
        this.method = ctx.method || 'GET';
        this.body = ctx.body || null;
        this.headers = ctx.headers || {};
        this.mode = ctx.mode || 'cors';
        this.redirect = ctx.redirect || 'manual';
        this.referrer = ctx.referrer || '';
        this.destination = ctx.destination || '';
    };
};

export { RequestContext };