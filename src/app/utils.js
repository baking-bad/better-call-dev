let utils = {
  formatAddress(address) { 
    return `${address.substr(0, 6)}...${address.substr(address.length - 3, 4)}` 
  },
  formatXTZ(amount) {
    if (amount == 0 || amount == undefined) {
      return "0 ꜩ";
    }
    return `${(amount / Math.pow(10, 6)).toString()} ꜩ`;
  }
}

export default utils
