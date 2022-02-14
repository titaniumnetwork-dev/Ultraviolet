function url(ctx, meta = ctx.meta) {
    const { css } = ctx;

    css.on('url', event => {
        event.value = ctx.rewriteUrl(event.value, meta);
    });
};

export { url };