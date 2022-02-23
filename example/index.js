import https from "https";
import httpStatic from "node-static";
import path from "path";
import { readFileSync, createReadStream, read } from "fs";
import { Server as Bare } from '../tomp/Server.mjs';

const __dirname = path.resolve(path.dirname(decodeURI(new URL(import.meta.url).pathname))).slice(3);
const config = JSON.parse(readFileSync(path.join(__dirname, './config.json'), 'utf-8'));
const file = new httpStatic.Server(path.join(__dirname, './static/'));

const server = https.createServer({
    key: readFileSync(path.join(__dirname, './ssl.key')),
    cert: readFileSync(path.join(__dirname, './ssl.cert')),
});

const bare = new Bare('/bare/');

server.on('request', (req, res) => {
    if (bare.route_request(req, res)) return true;

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

server.on('upgrade', (req, socket, head) => {
    if (!bare.route_upgrade(req, socket, head)) socket.end();
});

server.listen(3030);

function createUVFileStream(file) {
    return createReadStream(
        path.join(__dirname, '../lib/', file)
    );
};