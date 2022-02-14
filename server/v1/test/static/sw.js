addEventListener('fetch', async event => {

    const { request } = event;
    const url = new URL(request.url);
     
    const sendHeaders = {
        Accept: request.headers.get('accept'),
        'Accept-Language': request.headers.get('accept-language'),
        Host: 'www.google.com'
    };

    if (request.referrer) {
        sendHeaders.Referer = 'https://www.google.com' + request.referrer.slice(location.origin.length);
    };

    console.log(Object.fromEntries([...request.headers.entries()]), sendHeaders);

    event.respondWith(
        fetch('/bare/v1/', {
            headers: {
                'x-bare-host': 'www.google.com',
                'x-bare-port': '443',
                'x-bare-protocol': 'https:',
                'x-bare-path': url.pathname + url.search,
                'x-bare-headers': JSON.stringify(sendHeaders),
                'x-bare-forward-headers': JSON.stringify(['user-agent'])
            },
        })
    )
});