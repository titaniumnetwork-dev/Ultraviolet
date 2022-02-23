import http from 'http';
import { Server as Bare } from './Server.mjs';

const bare = new Bare('/');

http.createServer().on('request', (req, res) => 
    bare.route_request(req, res)
).on('upgrade', (req, socket, head) => 
    bare.route_upgrade(req, socket, head)
).listen(4545);
