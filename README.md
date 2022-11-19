<p align="center"><img src="https://raw.githubusercontent.com/titaniumnetwork-dev/Ultraviolet-Static/main/public/uv.png" height="200"></p>

<h1 align="center">Ultraviolet</h1>

<a href="https://www.npmjs.com/package/@titaniumnetwork-dev/ultraviolet"><img src="https://img.shields.io/npm/v/@titaniumnetwork-dev/ultraviolet.svg?maxAge=3600" alt="npm version" /></a>

Advanced web proxy used for evading internet censorship or accessing websites in a controlled sandbox.

Ultraviolet works by intercepting HTTP requests with a service worker script that follows the [TompHTTP specifications](https://github.com/tomphttp).

See the [changelog](./CHANGELOG.md) if you're using v1.0.1 or above!

## Documentation

Documentation can be found in the [wiki](https://github.com/titaniumnetwork-dev/Ultraviolet/wiki).

## How do I deploy/run this?

This repository is the bare-bones of Ultraviolet. This only contains the source code required to compile `uv.` scripts.

See [Ultraviolet-Node](https://github.com/titaniumnetwork-dev/Ultraviolet-Node) for easy instructions to deploy an Ultraviolet website.

An example of REALLY using this (API, copying files, etc) is in [Ultraviolet-Static](https://github.com/titaniumnetwork-dev/Ultraviolet-Static). See [scripts/build.js](https://github.com/titaniumnetwork-dev/Ultraviolet-Static/blob/main/scripts/build.js).

## I don't care about building, where are the scripts for my website?!

You can extract the scripts from the NPM package in the [releases section](https://github.com/titaniumnetwork-dev/Ultraviolet/releases). All the scripts you would typically look for (`uv.bundle.js`, `uv.handler.js`, `uv.sw.js`, and `uv.config.js`) are found within the `dist` directory.

If you cannot open the tar.gz (Chrome OS?), use a [converter](https://cloudconvert.com/tar.gz-to-zip). We can only do so much to make the scripts accessible.

## How do I install this?

> This will provide built files and the JS API to access the path of dist files.

Currently, we don't have an NPM package. As a current solution, you can install from a [GitHub release](https://github.com/titaniumnetwork-dev/Ultraviolet/releases). Copy the link to the `.tgz` and install using NPM.

```sh
$ npm install https://github.com/titaniumnetwork-dev/Ultraviolet/releases/download/v1.0.1/ultraviolet-1.0.1.tgz
```

## How do I build this?

1. Clone the repository

```sh
$ git clone https://github.com/titaniumnetwork-dev/Ultraviolet.git
> Cloning into Ultraviolet...
$ cd Ultraviolet
```

2. Install dependencies

```sh
$ npm install
```

3. Produce the `dist/` directory and compile scripts

```sh
$ npm run build
```

## Packaging

This is intended for releasing on hosting the package as a file, not on NPM.

```sh
$ npm pack
```

Package will be named `ultraviolet-X.X.X.tgz`
