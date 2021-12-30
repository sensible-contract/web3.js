
# This repo is temporarily suspended for maintenance, please move to [sensible-web3](https://github.com/sensible-contract/sensible-web3)
---
# web3.js - BitcoinSV JavaScript API

This is the BitcoinSV JavaScript API.

You need to connect a wallet to use this library.

Please read the [documentation][docs] for more.

## Installation

### Node

```bash
npm install @sensible-contract/web3
```

### Yarn

```bash
yarn add @sensible-contract/web3
```

### In the Browser

Use the prebuilt `dist/web3.min.js`, or
build using the [web3.js][repo] repository:

```bash
npm run build
```

Then include `dist/web3.min.js` in your html file.
This will expose `Web3` on the window object.

Or via jsDelivr CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@sensible-contract/web3@latest/dist/web3.min.js"></script>
```

UNPKG:

```html
<script src="https://unpkg.com/@sensible-contract/web3@latest/dist/web3.min.js"></script>
```

## Usage

```js
// In Node.js
const Web3 = require('web3-bsv');

let web3 = new Web3(sensilet);
console.log(web3);
> {
    bsv: ... ,
    sensible: ... ,
    utils: ...,
    ...
}
```

### Usage with TypeScript

We support types within the repo itself. Please open an issue here if you find any wrong types.

You can use `web3.js` as follows:

```typescript
import Web3 from "web3.js";
const web3 = new Web3(sensilet);
```

## Documentation

Documentation can be found at [ReadTheDocs][docs].

## Building

### Building (webpack)

Build the web3.js package:

```bash
yarn build
```

### Testing (mocha)

```bash
yarn test
```

[docs]: http://sensible-web3js.readthedocs.io/en/1.0/
