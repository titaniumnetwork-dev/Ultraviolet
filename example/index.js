import https from "https";
import httpStatic from "node-static";
import path from "path";
import { readFileSync, createReadStream, read } from "fs";
import request from "../server/v1/request.js";

const __dirname = path.resolve(path.dirname(decodeURI(new URL(import.meta.url).pathname))).slice(3);
const config = JSON.parse(readFileSync(path.join(__dirname, './config.json'), 'utf-8'));
const file = new httpStatic.Server(path.join(__dirname, './static/'));

const server = https.createServer({
    key: readFileSync(path.join(__dirname, './ssl.key')),
    cert: readFileSync(path.join(__dirname, './ssl.cert')),
});

server.on('request', (req, res) => {
    if (req.url.startsWith(config.bare + 'v1/')) {
        return request(req, res);
    };

    if (req.url.startsWith('/uv.handler.js')) {
        res.writeHead(200, { "Content-Type": "application/javascript" });
        createUVFileStream('uv.handler.js').pipe(res);
        return true;
    };

    if (req.url.startsWith('/uv.sw.js')) {
        res.writeHead(200, { "Content-Type": "application/javascript" });
        createUVFileStream('uv.sw.js').pipe(res);
        return true;
    };

    if (req.url.startsWith('/uv.bundle.js')) {
        res.writeHead(200, { "Content-Type": "application/javascript" });
        createUVFileStream('uv.bundle.js').pipe(res);
        return true;
    };

    if (req.url.startsWith(config.prefix)) {
        res.writeHead(200, { "Content-Type": "text/html" });
        createReadStream(path.join(__dirname, './load.html')).pipe(res);
        return true;
    };

    file.serve(req, res);
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
})

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


server.listen(443);

function createUVFileStream(file) {
    return createReadStream(
        path.join(__dirname, '../lib/', file)
    );
};