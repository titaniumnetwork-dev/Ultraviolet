import http from "http";
import https from "https";
import httpStatic from "node-static";
import path from "path";
import { readFileSync, createReadStream } from "fs";
import webpack from "webpack";

const __dirname = path.resolve(path.dirname(decodeURI(new URL(import.meta.url).pathname))).slice(3);
const file = new httpStatic.Server(path.join(__dirname, './static/'));

const server = https.createServer({
    key: readFileSync(path.join(__dirname, './ssl.key')),
    cert: readFileSync(path.join(__dirname, './ssl.cert')),
});

server.on('request', (req, res) => {

    if (req.url.startsWith('/service/')) {
        res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": 'no-cache' });
        createReadStream(path.join(__dirname, './load.html')).pipe(res);
        return;
    };

    if (!req.url.startsWith('/bare/v1/')) return file.serve(req, res);


    try {
        const headers = JSON.parse(req.headers['x-bare-headers']);
        const forward = JSON.parse((req.headers['x-bare-forward-headers'] || '[]'));
        const url = new URL(req.headers['x-bare-protocol'] + '//' + req.headers['x-bare-host'] + ':' + req.headers['x-bare-port'] + req.headers['x-bare-path']);

        for (const header of forward) {
            if (req.headers[header]) headers[header] = req.headers[header];
        };

        const remoteRequest = (url.protocol === 'https:' ? https : http).request(
            url,
            {
                headers: headers,
                method: req.method,
            }
        );

        remoteRequest.on('response', remoteResponse => {
            remoteResponse.headers['x-bare-headers'] = JSON.stringify(remoteResponse.headers);
            remoteResponse.headers['x-bare-status'] = remoteResponse.statusCode.toString();
            remoteResponse.headers['x-bare-status-text'] = remoteResponse.statusMessage;
            remoteResponse.headers['cache-control'] = 'no-cache';

            const headers = {
                'x-bare-headers': JSON.stringify(remoteResponse.headers),
                'x-bare-status': remoteResponse.statusCode.toString(),
                'x-bare-status-text': remoteResponse.statusMessage,
                'cache-control': 'no-cache',
            };

            if (remoteResponse.headers['content-encoding']) headers['content-encoding'] = remoteResponse.headers['content-encoding'];
            if (remoteResponse.headers['content-length']) headers['content-length'] = remoteResponse.headers['content-length'];

            res.writeHead(200, headers);
            remoteResponse.pipe(res);
        });

        remoteRequest.on('error', e => {
            res.writeHead(500, {});
            res.end();
        });

        req.pipe(remoteRequest);
    } catch(e) {
        res.writeHead(500, {});
        res.end();
    };

});

const impl = {
    'accept-encoding': 'Accept-Encoding',
    'accept-language': 'Accept-Language',
    'accept': 'Accept',
    'sec-websocket-extensions': 'Sec-WebSocket-Extensions',
    'sec-websocket-key': 'Sec-WebSocket-Key',
    'sec-websocket-version': 'Sec-WebSocket-Version'
};

server.on('upgrade', (req, socket, head) => {
    if (!req.url.startsWith('/bare/v1/') || !req.headers['sec-websocket-protocol']) return socket.end();
    try {
        const [ bare, data ] = req.headers['sec-websocket-protocol'].split(/,\s*/g);
        const { 
            remote,
            headers,
            forward_headers: forward,
        } = JSON.parse(decodeProtocol(data));

        for (const header of forward) {
            if (req.headers[header]) headers[(impl[header] || header)] = req.headers[header];
        };

        const url = new URL(remote.protocol + '//' + remote.host + ':' + remote.port + remote.path);
        const remoteRequest = (url.protocol === 'https:' ? https : http).request(
            url,
            {
                headers,
                method: req.method,
            }
        );

        remoteRequest.on('upgrade', (remoteResponse, remoteSocket, remoteHead) => {
            let handshake = 'HTTP/1.1 101 Web Socket Protocol Handshake\r\n';
            if (remoteResponse.headers['sec-websocket-accept']) handshake += `Sec-WebSocket-Accept: ${remoteResponse.headers['sec-websocket-accept']}\r\n`;
            if (remoteResponse.headers['sec-websocket-extensions']) handshake += `Sec-WebSocket-Extensions: ${remoteResponse.headers['sec-websocket-extensions']}\r\n`;
            handshake += `Sec-WebSocket-Protocol: bare\r\n`;
            if (remoteResponse.headers['connection']) handshake += `Connection: ${remoteResponse.headers['connection']}\r\n`;
            if (remoteResponse.headers['upgrade']) handshake += `Upgrade: ${remoteResponse.headers['upgrade']}\r\n`;
            handshake += '\r\n';
            socket.write(handshake);
            socket.write(remoteHead);
            remoteSocket.on('close', () => socket.end());
            socket.on('close', () => remoteSocket.end());
            remoteSocket.on('error', () => socket.end());
            socket.on('error', () => remoteSocket.end());
            
            remoteSocket.pipe(socket);
            socket.pipe(remoteSocket);
        });
        
        remoteRequest.on('error', () => socket.end());

        remoteRequest.end();

    } catch(e) {
        console.log(e);
        socket.end();
    };
});


server.listen(443);


const valid_chars = "!#$%&'*+-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ^_`abcdefghijklmnopqrstuvwxyz|~";
const reserved_chars = "%";

function encodeProtocol(protocol){
	protocol = protocol.toString();

	let result = '';
	
	for(let i = 0; i < protocol.length; i++){
		const char = protocol[i];

		if(valid_chars.includes(char) && !reserved_chars.includes(char)){
			result += char;
		}else{
			const code = char.charCodeAt();
			result += '%' + code.toString(16).padStart(2, 0);
		}
	}

	return result;
}

function decodeProtocol(protocol){
	if(typeof protocol != 'string')throw new TypeError('protocol must be a string');

	let result = '';
	
	for(let i = 0; i < protocol.length; i++){
		const char = protocol[i];
		
		if(char == '%'){
			const code = parseInt(protocol.slice(i + 1, i + 3), 16);
			const decoded = String.fromCharCode(code);
			
			result += decoded;
			i += 2;
		}else{
			result += char;
		}
	}

	return result;
}


function parseRawHeaders(rawHeaders = []) {
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

function compileParsedHeaders(headers = {}, prefix = false) {
    const compiled = {};

    for (const key in headers) {
        const { name, value } = headers[key];
        compiled[(prefix ? 'x-op-' : '') + name] = value;
    };

    return compiled;
};

webpack({
    mode: 'none',
    entry: path.join(__dirname, '../lib/index.js'),
    output: {
        path: __dirname,
        filename: './static/op.bundle.js',
    }
}, (err, i) => 
    console.log(!err ? 'Ultraviolet bundled!' : 'Err')
);