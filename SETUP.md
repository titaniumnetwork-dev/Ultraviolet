# Setup for beginners

Ultraviolet is very simple to configure and setup. You set a prefix in `uv.config.js`, which defaults to service. Placing an encoded url after the prefix will load the URL if the encoding on the config file is set correctly. 

For example, to go to Google if your prefix is /service and you use XOR encoding, you would go to `https://[url]/service/hvtrs8%2F-wuw%2Cgmoelg.aoo`

This can be setup just as is with a redirect from a search box, or you can use an iframe for adding other HTML.

To test UV, get the service worker registered which ever way you choose, and then go to the prefix, and then paste `hvtrs8%2F-wuw%2Cgmoelg.aoo` after the prefix. This should open google.com. 