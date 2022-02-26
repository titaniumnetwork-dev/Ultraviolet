# Ultraviolet
Web proxy used for evading internet censorship or accessing websites in a controlled sandbox.

Ultraviolet works by intercepting HTTP requests with a service worker script that follows the [TompHTTP](https://github.com/tomphttp) specifications


# Main scripts

The main scripts required for UV are located in `lib/`

- Scripts
    - `uv.sw.js` Service worker gateway
    - `uv.sw-handler.js` - Service worker handler
    - `uv.bundle.js` Webpack compiled Ultraviolet rewriter
    - `uv.handler.js` Client-side hooking
    - `uv.config.js` Configuration

# Deploy

[Deploy](https://github.com/titaniumnetwork-dev/uv-app)


# Authors

Caracal.js - Creator of Ultraviolet

Divide - Creator of TOMP
