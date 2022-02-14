import https from "https";
import path from "path";
import { readFileSync, createReadStream } from "fs";
import request from "../request.js";

const __dirname = path.resolve(path.dirname(decodeURI(new URL(import.meta.url).pathname))).slice(3);

https.createServer({
    key: readFileSync(path.join(__dirname, './ssl.key')),
    cert: readFileSync(path.join(__dirname, './ssl.cert')),
}, (req, res) => {
    if (req.url.startsWith('/sw.js')) {
        res.writeHead(200, { "Content-Type": 'application/javascript' });
        createReadStream(path.join(__dirname, './static/sw.js')).pipe(res);
        return;
    };

    if (req.url.startsWith('/script.js')) {
        res.writeHead(200, { "Content-Type": 'application/javascript' });
        createReadStream(path.join(__dirname, './static/script.js')).pipe(res);
        return;
    };
    
    if (req.url.startsWith('/bare/v1/')) {
        return request(req, res);
    };

    createReadStream(path.join(__dirname, './static/index.html')).pipe(res);
}).listen(443);