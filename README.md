<p align="center"><img src="https://raw.githubusercontent.com/titaniumnetwork-development/Ultraviolet-Static/main/public/uv.png" height="200"></p>

<h1 align="center">Ultraviolet</h1>

Advanced web proxy used for evading internet censorship or accessing websites in a controlled sandbox.

Ultraviolet works by intercepting HTTP requests with a service worker script that follows the [TompHTTP specifications](https://github.com/tomphttp).

See the [changelog](./CHANGELOG.md).

## How do I deploy/run this?

This repository is the bare-bones of Ultraviolet. This only contains the source code required to compile `uv.bundle.js`.

See [Ultraviolet-Node](https://github.com/titaniumnetwork-development/Ultraviolet-Node) for easy instructions to deploy an Ultraviolet website.

## How do I package this?

This is primarily for maintainers building then releasing on GitHub. We don't have an official NPM package.

```sh
$ git clone https://github.com/titaniumnetwork-development/Ultraviolet.git
> Cloning into Ultraviolet...
$ cd Ultraviolet
```

```sh
$ npm install
```

```sh
$ npm run build
```

```sh
$ npm pack
```

Package will be named `ultraviolet-X.X.X.tgz`