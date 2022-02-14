importScripts('/op.bundle.js');

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

const emptyBody = ['204'];

async function handle(request) {
    try {
    const parsed = new URL(request.url);

    if (parsed.pathname === '/op.bundle.js' || parsed.pathname === '/favicon.ico' || parsed.pathname === '/op.handler.js') return fetch(request);

    const rewrite = new Rewriter({
        meta: {
            origin: location.origin,
        },
        prefix: '/service/',
    });

    const db = await rewrite.cookie.db();

    rewrite.html.on('element', (element, type) => {
        if (type !== 'rewrite') return false;
        if (element.tagName !== 'head') return false;

        element.childNodes.unshift(
            {
                tagName: 'script',
                nodeName: 'script',
                childNodes: [],
                attrs: [
                    { name: 'src', value: '/op.handler.js', skip: true }
                ],
            }
        );

        element.childNodes.unshift(
            {
                tagName: 'script',
                nodeName: 'script',
                childNodes: [],
                attrs: [
                    { name: 'src', value: '/op.bundle.js', skip: true }
                ],
            }
        );
    });

    rewrite.addRewrites();

    if (!request.url.startsWith(location.origin) || request.url.startsWith(location.origin + rewrite.prefix)) {
        let blob = false;
        let requestUrl = '/fetch/asdsaadsad';

        rewrite.meta.base = rewrite.meta.url = !request.url.startsWith(location.origin) ? new URL(request.url) : new URL(rewrite.sourceUrl(request.url));

        if (rewrite.meta.url.protocol === 'blob:') {
            blob = true;
            rewrite.meta.base = rewrite.meta.url = new URL(rewrite.meta.url.pathname);
            requestUrl = 'blob:' + location.origin + rewrite.meta.url.pathname;
        };

        const requestHeaders = request.headers instanceof Headers ? Object.fromEntries([...request.headers.entries()]) : request.headers;
        let cookieStr = '';

        if (request.referrer && request.referrer.startsWith(location.origin)) {
            const referer = new URL(rewrite.sourceUrl(request.referrer));

            if (rewrite.meta.url.origin !== referer.origin && request.mode === 'cors') {
                request.headers.origin = referer.origin;
            };

            request.headers.referer = referer.href;
        };

        cookieStr = await rewrite.cookie.getCookies(await db.getAll('cookies'), rewrite.meta);

        requestHeaders.cookie = cookieStr;

        const headers = {
            'x-tomp-protocol': rewrite.meta.url.protocol,
            'x-tomp-host': rewrite.meta.url.hostname,
            'x-tomp-path': rewrite.meta.url.pathname + rewrite.meta.url.search,
            'x-tomp-port': rewrite.meta.url.port,
            'x-tomp-headers': JSON.stringify(requestHeaders),
            'x-tomp-forward-headers': JSON.stringify(['user-agent', 'accept', 'accept-encoding', 'accept', 'connection']),
        };

        const options = {
            method: request.method,
            headers: !blob ? headers : request.headers,
            redirect: request.redirect,
            mode: request.mode === 'cors' ? request.mode : 'same-origin',
        };

        if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) options.body = await request.blob();
        
        const newRequest = new Request(requestUrl, options);

        const processed = fetch(newRequest).then(async response => {
            let body = response.body;

            const resHeaders = new Headers(response.headers);

            const rawHeaders = response.headers.has('x-tomp-headers') ? JSON.parse(response.headers.get('x-tomp-headers')) : Object.fromEntries([...response.headers.entries()]);
            const status = response.headers.get('x-tomp-status') || response.status;
            const statusText = response.headers.get('x-tomp-status-text') || response.statusText;

            for (let header in rawHeaders) {
                if (csp.indexOf(header) > -1) delete rawHeaders[header];
            };

            if (rawHeaders.location) {
                rawHeaders.location = rewrite.rewriteUrl(rawHeaders.location);
            };

            if (rawHeaders['set-cookie']) {
                Promise.resolve(rewrite.cookie.setCookies(rawHeaders['set-cookie'], db, rewrite.meta)).then(() => {
                    self.clients.matchAll().then(function (clients){
                        clients.forEach(function(client){
                            client.postMessage({
                                msg: 'updateCookies',
                                url: rewrite.meta.url.href,
                            });
                        });
                    });
                });
                delete rawHeaders['set-cookie'];
            };

            if (isHtml(rewrite.meta.url, (resHeaders.get('content-type') || ''))) {
                body = rewrite.rewriteHtml(
                    await response.text(), 
                    { 
                        document: true 
                    }
                ); 
            }; 

            if (request.destination === 'script') {
                body = rewrite.js.rewrite(
                    await response.text()
                ); 
            };

            if (request.destination === 'worker') {
                body = `if (!self.__op) importScripts('/op.bundle.js', '/op.handler.js');\n`;
                body += rewrite.js.rewrite(
                    await response.text()
                ); 
            };

            if (request.destination === 'style') {
                body = rewrite.rewriteCSS(
                    await response.text()
                ); 
            };
            
            if (emptyBody.includes(status)) {
                return new Response(null, {
                    headers: rawHeaders,
                    status,
                    statusText,
                });
            };
            
            return new Response(body, {
                headers: rawHeaders,
                status,
                statusText,
            });
        });
        
        return processed;

    };
    } catch(e) {
        return new Response(e.toString());
    };
}

self.addEventListener('fetch', event => {
    if (event.request.url) event.respondWith(handle(event.request));
});


function isHtml(url, contentType = '') {
    return (Rewriter.mime.contentType((contentType  || url.pathname)) || 'text/html').split(';')[0] === 'text/html';
};