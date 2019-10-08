import { NetConfig } from '../netConfig'
const ENTITY = "operations";

export function setupConseil(net) {
  let config = new NetConfig(net).conseilConfig();

  return {
    ...config,
    entity: ENTITY
  }
}