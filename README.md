# Better Call Dev
[![Build Status](https://travis-ci.org/baking-bad/better-call-dev.svg?branch=master)](https://travis-ci.org/baking-bad/better-call-dev)
[![Docker Build Status](https://img.shields.io/docker/cloud/build/bakingbad/better-call-dev)](https://hub.docker.com/r/bakingbad/better-call-dev)
[![Made With: Vue.js](https://img.shields.io/badge/vue-2.6.10-green.svg?)](https://vuejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Yet another Tezos explorer created specifically for smart contract developers

[![Better Call Dev](https://miro.medium.com/max/1632/1*shi7Y-RVeMCbozwk2rzbsQ.png)](https://old.better-call.dev)

## See it in action
[https://old.better-call.dev](https://old.better-call.dev)

## Read the paper
[Michelson rocks but you better call dev](https://medium.com/coinmonks/michelson-rocks-but-you-better-call-dev-e23cd32a299a)

## Run locally
Requires Node.js 11.4+

```bash
git clone https://github.com/baking-bad/better-call-dev.git
cd better-call-dev
npm i
npm run serve
```

## Run in docker
Verified dockerhub build at [https://hub.docker.com/r/bakingbad/better-call-dev](https://hub.docker.com/r/bakingbad/better-call-dev)

```bash
docker run --name mybcd -p 127.0.0.1:8080:80 -d bakingbad/better-call-dev
```

## Change Tezos RPC endpoint

Add `?blockUrl=` query parameter containing an urlencoded URI:  
`{scheme}://{host}:{port}/{path}/chains/{chain}/blocks`  

Example:  
[https://old.better-call.dev/babylon/KT1M3gUfMDWrW9BxHzn6iwwuQ6V9HQe5rk6a/operations?blockUrl=https%3A%2F%2Ftezos-dev.cryptonomic-infra.tech%2Fchains%2Fmain%2Fblocks](https://old.better-call.dev/babylon/KT1M3gUfMDWrW9BxHzn6iwwuQ6V9HQe5rk6a/operations?blockUrl=https%3A%2F%2Ftezos-dev.cryptonomic-infra.tech%2Fchains%2Fmain%2Fblocks)

## Sponsored by
[Tezos Foundation](https://tezos.foundation/)
