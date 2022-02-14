import http from 'http';
import https from 'https';
import { json, prepareRequest, prepareResponse } from './util.js';

function request(request, response) {
    try {
        const data = prepareRequest(request);
        const protocol = data.protocol === 'https:' ? https : http;

        const remoteRequest = protocol.request(data);
        
        remoteRequest.on('response', remoteResponse => {
            const send = prepareResponse(remoteResponse);
            response.writeHead(...send);
            remoteResponse.pipe(response);
        });

        remoteRequest.on('error', e => {
            console.log(e);
            json(response, 500, {
                error: e.toString()
            });
        });

        request.pipe(remoteRequest);
    } catch(e) {
        console.log(e);
        json(response, 500, {
            error: e.toString()
        });
    };
};

export default request;