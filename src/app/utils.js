import { aliases } from './bakersAliases.js'

let utils = {
  formatAddress(address) {
    if (aliases[address] !== undefined) {
      return aliases[address].name.padEnd(36, " ");
    }
    return address; 
  },
  formatXTZ(amount, decimals=6) {
    amount = parseFloat(amount)
    if (amount == 0 || amount == undefined) {
      return "0 ꜩ";
    }

    return `${(amount / Math.pow(10, 6)).toFixed(decimals).toString()} ꜩ`;
  }
}

export default utils
