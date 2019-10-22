import { aliases } from './bakersAliases.js'

let utils = {
  formatAddress(address) {
    if (aliases[address] !== undefined) {
      return aliases[address].name.padEnd(36, " ");
    }
    return address;
  },
  formatXTZ(amount, decimals = 6) {
    amount = parseFloat(amount)
    if (amount == 0 || amount == undefined) {
      return "0 ꜩ";
    }

    return `${(amount / Math.pow(10, 6)).toFixed(decimals).toString()} ꜩ`;
  },
  payoutSignature() {
    return '{"prim":"code","args":[[[[{"prim":"DUP"},{"prim":"CAR"},{"prim":"DIP","args":[[{"prim":"CDR"}]]}]],{"prim":"IF_LEFT","args":[[{"prim":"PUSH","args":[{"prim":"mutez"},{"int":"0"}]},{"prim":"AMOUNT"},[[{"prim":"COMPARE"},{"prim":"EQ"}],{"prim":"IF","args":[[],[[{"prim":"UNIT"},{"prim":"FAILWITH"}]]]}],[{"prim":"DIP","args":[[{"prim":"DUP"}]]},{"prim":"SWAP"}],{"prim":"IMPLICIT_ACCOUNT"},{"prim":"ADDRESS"},{"prim":"SENDER"},[[{"prim":"COMPARE"},{"prim":"EQ"}],{"prim":"IF","args":[[],[[{"prim":"UNIT"},{"prim":"FAILWITH"}]]]}],{"prim":"UNIT"},{"prim":"EXEC"},{"prim":"PAIR"}],[{"prim":"DROP"},{"prim":"NIL","args":[{"prim":"operation"}]},{"prim":"PAIR"}]]}]]}'
  }
}

export default utils
