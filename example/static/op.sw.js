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
    ],
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

Brazen('/bare/v1/', {
    prefix: '/service/',
});

function Brazen(bare, config = {}) {
    if (!bare) throw new Error('No barer server given. Cannot make connections without one.');
    addEventListener('fetch', event => {
        event.respondWith(handler(event.request, config, bare));
    });
};


async function handler(request, config = {}, bare) {
    try {
        let blob = false;
        const clientRequest = request;
        const _url = new URL(clientRequest.url);
        const rewrite = new Rewriter(config);
        const db = await rewrite.cookie.db();
        let fetchUrl = bare;

        if (!request.url.startsWith(location.origin) || !_url.pathname.startsWith(rewrite.prefix) || (config.skip || []).includes(request.url)) {
            return fetch(request);
        };

        rewrite.meta.origin = location.origin;
        rewrite.meta.base = rewrite.meta.url = new URL(rewrite.sourceUrl(request.url));

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

            element.childNodes.unshift(
                {
                    tagName: 'script',
                    nodeName: 'script',
                    childNodes: [
                        {
                            nodeName: '#text',
                            value: `window.__opCookies = atob("${btoa(rewrite.cookie.serialize(element.options.cookies, rewrite.meta, true))}");\nwindow.__opReferrer = atob("${btoa(request.referrer)}");`
                        },
                    ],
                    attrs: [],
                    skip: true,
                }
            );
        });

        rewrite.addRewrites();

        if (rewrite.meta.url.protocol === 'blob:') {
            blob = true;
            rewrite.meta.base = rewrite.meta.url = new URL(rewrite.meta.url.pathname);
            fetchUrl = 'blob:' + location.origin + rewrite.meta.url.pathname;
        };

        const { url } = rewrite.meta;
        const sendHeaders = Object.fromEntries([...request.headers.entries()]);

        sendHeaders['user-agent'] = navigator.userAgent;

        if (request.referrer && request.referrer.startsWith(location.origin)) {
            const referer = new URL(rewrite.sourceUrl(request.referrer));

            if (rewrite.meta.url.origin !== referer.origin && request.mode === 'cors') {
                sendHeaders.origin = referer.origin;
            };

            sendHeaders.referer = referer.href;
        };

        //const cookies = await rewrite.cookie.getCookies(await db.getAll('cookies'), rewrite.meta) || '';
        const cookies = await rewrite.cookie.getCookies(db) || [];
        const cookieStr = rewrite.cookie.serialize(cookies, rewrite.meta, false);
        if (cookieStr) sendHeaders.cookie = cookieStr;

        const barer = {
            'x-bare-protocol': url.protocol,
            'x-bare-host': url.hostname,
            'x-bare-path': url.pathname + url.search,
            'x-bare-port': url.port,
            'x-bare-headers': JSON.stringify(sendHeaders),
            'x-bare-forward-headers': JSON.stringify(headers.forward),
        };

        const options = {
            method: request.method,
            headers: !blob ? barer : request.headers,
            redirect: request.redirect,
            credentials: 'omit',
            mode: request.mode === 'cors' ? request.mode : 'same-origin',
        };

        if (!method.empty.includes(request.method.toUpperCase())) options.body = await request.blob();

        const remoteRequest = !blob ? new Request(fetchUrl, options) : new Request(fetchUrl);
        const remoteResponse = await fetch(remoteRequest);

        if (remoteResponse.status === 500) {
            return Promise.reject('Err');
        };

        const sendData = !blob ? getBarerResponse(remoteResponse) : {
            status: remoteResponse.status,
            statusText: remoteResponse.statusText,
            headers: Object.fromEntries([...remoteResponse.headers.entries()]),
            body: remoteResponse.body,
        };

        for (const name of headers.csp) {
            if (sendData.headers[name]) delete sendData.headers[name];
        }; 
        
        if (sendData.headers.location) {
            sendData.headers.location = rewrite.rewriteUrl(sendData.headers.location);
        };

        if (sendData.headers['set-cookie']) {
            Promise.resolve(rewrite.cookie.setCookies(sendData.headers['set-cookie'], db, rewrite.meta)).then(() => {
                self.clients.matchAll().then(function (clients){
                    clients.forEach(function(client){
                        client.postMessage({
                            msg: 'updateCookies',
                            url: rewrite.meta.url.href,
                        });
                    });
                });
            });
            delete sendData.headers['set-cookie'];
        };

        if (statusCode.empty.includes(sendData.status)) {
            return new Response(null, {
                headers: sendData.headers,
                status: sendData.status,
                statusText: sendData.statusText,
            });
        };


        switch(request.destination) {
            case 'script':
                sendData.body = rewrite.js.rewrite(
                    await remoteResponse.text()
                );
                break;
            case 'worker':
                sendData.body = `if (!self.__op) importScripts('/op.bundle.js', '/op.handler.js');\n`;
            sendData.body += rewrite.js.rewrite(
                await remoteResponse.text()
            );
                break;
            case 'style':
                sendData.body = rewrite.rewriteCSS(
                    await remoteResponse.text()
                ); 
                break;
            /*
            case 'document':
            case 'iframe':
                sendData.body = rewrite.rewriteHtml(
                    await remoteResponse.text(), 
                    { 
                        document: true,
                        cookies,
                    }
                );
            */
           /*
            default:
                if (request.mode !== 'cors' && isHtml(rewrite.meta.url, (sendData.headers['content-type'] || ''))) {
                    sendData.body = rewrite.rewriteHtml(
                        await remoteResponse.text(), 
                        { 
                            document: true ,
                            cookies,
                        }
                    );      
                };
            */
           case 'iframe':
           case 'document':
                if (isHtml(rewrite.meta.url, (sendData.headers['content-type'] || ''))) {
                    sendData.body = rewrite.rewriteHtml(
                        await remoteResponse.text(), 
                        { 
                            document: true ,
                            cookies,
                        }
                    );      
                };
        };

        // EventSource support
        if (sendHeaders.accept === 'text/event-stream') {
            sendData.headers['content-type'] = 'text/event-stream';
        };

        return new Response(sendData.body, {
            headers: sendData.headers,
            status: sendData.status,
            statusText: sendData.statusText,
        });
    } catch(e) {
        return new Response(e.toString(), {
            status: 500,
        });
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
    return (Rewriter.mime.contentType((contentType  || url.pathname)) || 'text/html').split(';')[0] === 'text/html';
};