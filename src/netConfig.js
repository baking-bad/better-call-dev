
const tezosNets = {
  main: {
    value: "main",
    text: "MainNet", 
    blockUrl: "https://rpc.tezrpc.me/chains/main/blocks",
    tzScanUrl: "https://api5.tzscan.io/v1",
    conseil: {
      server: {
        apiKey: "galleon",
        url: "https://conseil-prod.cryptonomic-infra.tech"
      },
      platform: "tezos",
      network: "mainnet"
    }
  },
  alpha: {
    value: "alpha",
    text: "AlphaNet", 
    blockUrl: "https://tezos-dev.cryptonomic-infra.tech/chains/main/blocks",
    tzScanUrl: "https://api.alphanet.tzscan.io/v1",
    conseil: {
      server: {
        apiKey: "galleon",
        url: "https://conseil-dev.cryptonomic-infra.tech"
      },
      platform: "tezos",
      network: "alphanet",
    }
  },
  sandbox: {
    value: "sandbox",
    text: "Sandbox", 
    blockUrl: "http://127.0.0.1:8732/chains/main/blocks"
  }
};

const networks = Object.keys(tezosNets);

class NetConfig {
  constructor(net) {
    if (!tezosNets.hasOwnProperty(net)) {
      throw `${net} is not a known netwotk (${Object.keys(tezosNets)})`;
    }
    this.net = net;
    this.netConfig = tezosNets[this.net];
  }

  implementsConseil() {
    return this.netConfig.hasOwnProperty("conseil");
  }

  conseilConfig() {
    let config = this.netConfig;
    if (!this.implementsConseil()) {
      throw `${this.net} has no conseil API`;
    }
    return config.conseil;
  }

  tzScanUrl() {
    let config = this.netConfig;
    if (!config.hasOwnProperty("tzScanUrl")) {
      throw `${this.net} has no tzScanUrl`;
    }
    return config.tzScanUrl;
  }

  blockUrl() {
    let config = this.netConfig;
    if (!config.hasOwnProperty("blockUrl")) {
      throw `${this.net} has no blockUrl`;
    }
    return config.blockUrl;
  }
}

export {networks, tezosNets, NetConfig};