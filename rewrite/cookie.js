// -------------------------------------------------------------
// WARNING: this file is used by both the client and the server.
// Do not use any browser or node-specific API!
// -------------------------------------------------------------
import setCookie from 'set-cookie-parser';

function validateCookie(cookie, meta, js = false) {
    if (cookie.httpOnly && !!js) return false;

    if (cookie.domain.startsWith('.')) {

        if (!meta.url.hostname.endsWith(cookie.domain.slice(1))) return false;
        return true;
    };

    if (cookie.domain !== meta.url.hostname) return false;
    if (cookie.secure && meta.url.protocol === 'http:') return false;
    if (!meta.url.pathname.startsWith(cookie.path)) return false;

    return true;
};

async function db(openDB) {
    const db = await openDB('__op', 1, {
        upgrade(db, oldVersion, newVersion, transaction) {
            const store = db.createObjectStore('cookies', {
                keyPath: 'id',
            });
            store.createIndex('path', 'path');
        },
    });
    db.transaction(['cookies'], 'readwrite').store.index('path');
    return db;
};


function serialize(cookies = [], meta, js) {
    let str = '';
    for (const cookie of cookies) {
        if (!validateCookie(cookie, meta, js)) continue;
        if (str.length) str += '; ';
        str += cookie.name;
        str += '='
        str += cookie.value;
    }; 
    return str;
};

async function getCookies(db) {
    const now = new Date();
    return (await db.getAll('cookies')).filter(cookie => {
        
        let expired = false;
        if (cookie.set) {
            if (cookie.maxAge) {
                expired = (cookie.set.getTime() + (cookie.maxAge * 1e3)) < now;
            } else if (cookie.expires) {
                expired = new Date(cookie.expires.toLocaleString()) < now;
            };
        };

        if (expired) {
            db.delete('cookies', cookie.id);
            return false;
        };

        return  true;
    });
};

function setCookies(data, db, meta) {
    if (!db) return false;

    const cookies = setCookie(data, {
        decodeValues: false,
    })
    
    for (const cookie of cookies) {
        if (!cookie.domain) cookie.domain = '.' + meta.url.hostname;
        if (!cookie.path) cookie.path = '/';

        if (!cookie.domain.startsWith('.')) {
            cookie.domain = '.' + cookie.domain;
        };

        db.put('cookies', {
            ...cookie, 
            id: `${cookie.domain}@${cookie.path}@${cookie.name}`,
            set: new Date(Date.now()),
        });
    };
    return true;
};

export { validateCookie, getCookies, setCookies, db , serialize };