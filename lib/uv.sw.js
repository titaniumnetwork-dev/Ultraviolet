importScripts('/uv.bundle.js');

const csp = [
	'cross-origin-embedder-policy',
	'cross-origin-opener-policy',
	'cross-origin-resource-policy',
	'content-security-policy',
	'content-security-policy-report-only',
	'expect-ct',
	'feature-policy',
	'origin-isolation',
	'strict-transport-security',
	'upgrade-insecure-requests',
	'x-content-type-options',
	'x-download-options',
	'x-frame-options',
	'x-permitted-cross-domain-policies',
	'x-powered-by',
	'x-xss-protection',
];

const headers = {
    csp: [
        'cross-origin-embedder-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy',
        'content-security-policy',
        'content-security-policy-report-only',
        'expect-ct',
        'feature-policy',
        'origin-isolation',
        'strict-transport-security',
        'upgrade-insecure-requests',
        'x-content-type-options',
        'x-download-options',
        'x-frame-options',
        'x-permitted-cross-domain-policies',
        'x-powered-by',
        'x-xss-protection',
    ],
    forward: [
        'accept-encoding', 
        'accept', 
        'connection',
        'content-length',
        'content-type',
        'user-agent',
    ],
};

const scripts = {
    package: '/uv.bundle.js',
    handler: '/uv.handler.js',
};

const method = {
    empty: ['GET', 'HEAD']
};

const statusCode = {
    empty: [ 
        204,
        304,
    ],
};

const handler = UVServiceWorker('/bare/v1/', {});

addEventListener('fetch', 
    async event => {
        return  event.respondWith(handler(event));

    },  
);


function UVServiceWorker(bare = '/bare/v1/', options) {
    try {
    return async function handler(event) {
        const { request } = event;

        try {
            if (!request.url.startsWith(location.origin + (options.prefix || '/service/'))) {
                return fetch(request);
            };

            const requestCtx = {
                url: bare,
                referrer: false,
                headers: {},
                forward: headers.forward,
                method: request.method,
                body: !method.empty.includes(request.method.toUpperCase()) ? await request.blob() : null,
                redirect: request.redirect,
                credentials: 'omit',
                mode: request.mode === 'cors' ? request.mode : 'same-origin',
                blob: false,
            };

            const uv = new Ultraviolet(options);
            const db = await uv.cookie.db();
            
            uv.meta.origin = location.origin;
            uv.meta.base = uv.meta.url = new URL(uv.sourceUrl(request.url));

            uv.html.on('element', (element, type) => {
                if (type !== 'rewrite') return false;
                if (element.tagName !== 'head') return false;
        
                element.childNodes.unshift(
                    {
                        tagName: 'script',
                        nodeName: 'script',
                        childNodes: [],
                        attrs: [
                            { name: 'src', value: scripts.handler, skip: true }
                        ],
                    }
                );
        
                element.childNodes.unshift(
                    {
                        tagName: 'script',
                        nodeName: 'script',
                        childNodes: [],
                        attrs: [
                            { name: 'src', value: scripts.package, skip: true }
                        ],
                    }
                );

                element.childNodes.unshift(
                    {
                        tagName: 'script',
                        nodeName: 'script',
                        childNodes: [
                            {
                                nodeName: '#text',
                                value: `window.__uv$cookies = atob("${btoa(uv.cookie.serialize(element.options.cookies, uv.meta, true))}");\nwindow.__uv$referrer = atob("${btoa(request.referrer)}");`
                            },
                        ],
                        attrs: [],
                        skip: true,
                    }
                );
            });

            if (uv.meta.url.protocol === 'blob:') {
                requestCtx.blob = true;
                uv.meta.base = uv.meta.url = new URL(uv.meta.url.pathname);
                requestCtx.url = 'blob:' + location.origin + uv.meta.url.pathname;
            };

            requestCtx.headers = Object.fromEntries([...request.headers.entries()]);

            if (request.referrer && request.referrer.startsWith(location.origin)) {
                const referer = new URL(uv.sourceUrl(request.referrer));

                if (uv.meta.url.origin !== referer.origin && request.mode === 'cors') {
                    requestCtx.headers.origin = referer.origin;
                };

                requestCtx.headers.referer = referer.href;
            };

            const cookies = await uv.cookie.getCookies(db) || [];
            const cookieStr = uv.cookie.serialize(cookies, uv.meta, false);
            if (cookieStr) requestCtx.headers.cookie = cookieStr;

            const bareHeaders = {
                'x-bare-protocol': uv.meta.url.protocol,
                'x-bare-host': uv.meta.url.hostname,
                'x-bare-path': uv.meta.url.pathname + uv.meta.url.search,
                'x-bare-port': uv.meta.url.port,
                'x-bare-headers': JSON.stringify(requestCtx.headers),
                'x-bare-forward-headers': JSON.stringify(requestCtx.forward),
            };

            const fetchOptions = {
                method: requestCtx.method,
                headers: !requestCtx.blob ? bareHeaders : requestCtx.headers,
                redirect: requestCtx.redirect,
                credentials: requestCtx.credentials,
                mode: requestCtx.mode,
            };
            if (requestCtx.body) fetchOptions.body = requestCtx.body;

            const response = await fetch(requestCtx.url, fetchOptions);
            if (response.status === 500) {
                return Promise.reject('Err');
            };

            const sendData = !requestCtx.blob ? getBarerResponse(response) : {
                status: response.status, 
                statusText: response.statusText,
                headers: Object.fromEntries([...response.headers.entries()]),
                body: response.body,
            }; 

            const responseCtx = {
                headers: sendData.headers,
                status: sendData.status,
                statusText: sendData.statusText,
                body: !statusCode.empty.includes(sendData.status) ? sendData.body : null,
            };
            
            for (const name of headers.csp) {
                if (responseCtx.headers[name]) delete responseCtx.headers[name];
            }; 
            
            if (responseCtx.headers.location) {
                responseCtx.headers.location = uv.rewriteUrl(responseCtx.headers.location);
            };

            if (responseCtx.headers['set-cookie']) {
                Promise.resolve(uv.cookie.setCookies(responseCtx.headers['set-cookie'], db, uv.meta)).then(() => {
                    self.clients.matchAll().then(function (clients){
                        clients.forEach(function(client){
                            client.postMessage({
                                msg: 'updateCookies',
                                url: uv.meta.url.href,
                            });
                        });
                    });
                });
                delete responseCtx.headers['set-cookie'];
            };

            if (responseCtx.body) {
                switch(request.destination) {
                    case 'script':
                        responseCtx.body = `if (!self.__uv && self.importScripts) importScripts('/uv.bundle.js', '/uv.handler.js');\n`;
                        responseCtx.body += uv.js.rewrite(
                            await response.text()
                        );
                        break;
                    case 'worker':
                        responseCtx.body = `if (!self.__uv) importScripts('/uv.bundle.js', '/uv.handler.js');\n`;
                        responseCtx.body += uv.js.rewrite(
                        await response.text()
                    );
                        break;
                    case 'style':
                        responseCtx.body = uv.rewriteCSS(
                            await response.text()
                        ); 
                        break;
                case 'iframe':
                case 'document':
                        if (isHtml(uv.meta.url, (sendData.headers['content-type'] || ''))) {
                            responseCtx.body = uv.rewriteHtml(
                                await response.text(), 
                                { 
                                    document: true ,
                                    cookies,
                                }
                            );      
                        };
                };
            };

            if (requestCtx.headers.accept === 'text/event-stream') {
                requestCtx.headers['content-type'] = 'text/event-stream';
            };

            return new Response(responseCtx.body, {
                headers: responseCtx.headers,
                status: responseCtx.status,
                statusText: responseCtx.statusText,
            });
        } catch(e) {
            console.log(e);
            return new Response(e.toString(), {
                status: 500,
            });
        };
    };
} catch(e) {
    console.log(e);
    return (event) => {
        event.respondWith(new Response(e.toString(), {
            status: 500,
        }))
    };
};  
};

function getBarerResponse(response) {
    return {
        headers: JSON.parse(response.headers.get('x-bare-headers')),
        status: +response.headers.get('x-bare-status'),
        statusText: response.headers.get('x-bare-status-text'),
        body: response.body,
    };
};

function isHtml(url, contentType = '') {
    return (Ultraviolet.mime.contentType((contentType  || url.pathname)) || 'text/html').split(';')[0] === 'text/html';
};