if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });
        navigator.serviceWorker.ready.then(() => {
            location.reload()
        })
};