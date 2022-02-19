export function prepareResponse({ headers, statusCode, statusMessage }) {
    const sendHeaders = {
        'x-bare-headers': JSON.stringify(headers),   
        'x-bare-status': statusCode.toString(),
        'x-bare-status-text': statusMessage,
    };

    if (headers['content-encoding']) sendHeaders['content-encoding'] = headers['content-encoding'];
    if (headers['content-length']) sendHeaders['content-length'] = headers['content-length'];

    return [ 200, sendHeaders ];
};

export function prepareRequest({ headers, rawHeaders, method }) {
    if (!'x-bare-headers' in headers) throw new Error('Headers missing.');
    if (!('x-bare-protocol' in headers || 'x-bare-host' in headers || 'x-bare-port' in headers || 'x-bare-path' in headers)) {
        throw new Error('URL key missing.');
    };

    const forward = JSON.parse((getBareHeader('forward-headers', headers) || '[]'));
    const sendHeaders = JSON.parse((getBareHeader('headers', headers) || '{}'));
    const raw = constructRawHeaders(rawHeaders);

    for (const name of forward) {
        if (name in raw) {
            sendHeaders[raw[name].name] = raw[name].value;
        };
    };

    return {
        headers: sendHeaders,
        host: getBareHeader('host', headers),
        port: getBareHeader('port', headers),
        protocol: getBareHeader('protocol', headers),
        path: getBareHeader('path', headers),
        localAddress: null,
        agent: null,
        method,
    }
};

export function json(response, status, json) {
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(
        typeof json === 'object' ? JSON.stringify(json) : json
    );
};

export function getBareHeader(name, headers = {}) {
    return headers[`x-bare-${name}`] || null;
};

export function constructRawHeaders(rawHeaders = []) {
    const obj = {};

    for (let i = 0; i < rawHeaders.length; i+=2) {
        const name = rawHeaders[i] || '';
        const lowerCaseName = name.toLowerCase();
        const value = rawHeaders[i + 1] || '';

        if (lowerCaseName in obj) {
            if (Array.isArray(obj[lowerCaseName].value)) {
                obj[lowerCaseName].value.push(value);
            } else {
                obj[lowerCaseName].value = [ obj[lowerCaseName].value, value ];
            };
        } else {
            obj[lowerCaseName] = { name, value };
        };
    };

    return obj;
};