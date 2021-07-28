const axios = require('axios').default;

export class RequestFailedError extends Error { }

export class NodeRPC {
  constructor(endpoints) {
    this.api = {};
    Object.keys(endpoints).forEach(function (network) {
      this.api[network] = axios.create({
        baseURL: endpoints[network],
        timeout: 30000,
        responseType: 'json'
      });
    }, this);
  }

  getApi(network) {
    if (network in this.api) {
      return this.api[network];
    } else {
      throw new RequestFailedError(`Don't have an RPC endpoint for the "${network}"`);
    }
  }

  getOperation(network, level, hash) {
    return this.getApi(network).get(`/chains/main/blocks/${level}/operations/3`)
      .then((res) => {
        if (res.status != 200) {
          throw new RequestFailedError(res);
        }
        let data = res.data
        let url = `${res.config.baseURL}${res.config.url}`

        for (let i = 0; i < data.length; i++) {
          if (data[i].hash == hash) return { data: data[i], url };
        }
        throw new RequestFailedError(res);
      })
  }

  getBigMapValue(network, level, ptr, key_hash) {
    return this.getApi(network).get(`/chains/main/blocks/${level}/context/big_maps/${ptr}/${key_hash}`)
      .then((res) => {
        if (res.status != 200) {
          throw new RequestFailedError(res);
        }
        let url = `${res.config.baseURL}${res.config.url}`
        return { data: res.data, url};
      })
  }

  getContractCode(network, level, address) {
    return this.getApi(network).get(`/chains/main/blocks/${level}/context/contracts/${address}/script`)
      .then((res) => {
        if (res.status != 200) {
          throw new RequestFailedError(res);
        }
        let url = `${res.config.baseURL}${res.config.url}`
        return { data: res.data.code, url };
      })
  }

  getContractStorage(network, level, address) {
    return this.getApi(network).get(`/chains/main/blocks/${level}/context/contracts/${address}/storage`)
      .then((res) => {
        if (res.status != 200) {
          throw new RequestFailedError(res);
        }
        let url = `${res.config.baseURL}${res.config.url}`
        return { data: res.data, url };
      })
  }

  getBigMapTotalBytes(network, level, ptr) {
    return this.getApi(network).get(`/chains/main/blocks/${level}/context/raw/json/big_maps/index/${ptr}/total_bytes`)
      .then((res) => {
        if (res.status != 200) {
          throw new RequestFailedError(res);
        }
        let url = `${res.config.baseURL}${res.config.url}`
        return { data: res.data, url };
      })
  }
}