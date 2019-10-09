import tezosNets from './tezosNets.json'

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