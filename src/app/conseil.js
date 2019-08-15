const API_KEY = "galleon";
const PLATFORM = "tezos";
const ENTITY = "operations";

export function setupConseil(net) {
  let network = "";
  let url = "";

  if (net === "alpha") {
    network = "alphanet"
    url = 'https://conseil-dev.cryptonomic-infra.tech'
  } else if (net === "main") {
    network = "mainnet"
    url = 'https://conseil-prod.cryptonomic-infra.tech'
  } else {
    // eslint-disable-next-line
    console.log("we have a problem")
  }

  return {
    server: { url: url, apiKey: API_KEY },
    platform: PLATFORM,
    network: network,
    entity: ENTITY
  }
}
