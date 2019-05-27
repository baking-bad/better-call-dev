<template>
  <div id="app">
    <GithubCorner/>
    <b-container>
      <Loader :status="isLoading"/>
      <b-row>
        <SearchForm
          :address="address"
          :tezosNet="tezosNet"
          @update="updateAddress"
          @updateNet="updateNet"
          @explore="explore"
          @demo="demo"
        />
        <NotFound :status="notFound"/>
        <Results
          :address="address"
          :tezosNet="tezosNet"
          :status="isReady"
          :activetab="activetab"
          :groups="groups"
          :morePages="txInfo.morePages"
          :decodedData="decoded_data"
          :decodedSchema="decoded_schema"
          :parameterSchema="parameterSchema"
          @loadmore="loadMore"
          @changeTab="changeTab"
        />
      </b-row>
    </b-container>
  </div>
</template>

<script>
import axios from "axios";

import GithubCorner from "./components/GithubCorner.vue";
import Loader from "./components/Loader.vue";
import NotFound from "./components/NotFound.vue";
import Results from "./components/Results.vue";
import SearchForm from "./components/SearchForm.vue";

export default {
  name: "app",
  components: {
    GithubCorner,
    Loader,
    NotFound,
    Results,
    SearchForm
  },
  data: () => ({
    isLoading: false,
    address: "",
    tezosNet: "alpha",
    activetab: 1,
    isReady: false,
    notFound: false,
    resultForParameter: {},
    resultForStorage: {},
    decoded_data: {},
    decoded_schema: {},
    parameterSchema: {},
    txInfo: {
      morePages: false,
      currentPage: 0,
      data: []
    },
    groups: {},
    tezaurus: {}
  }),
  computed: {
    baseApiURL() {
      if (this.tezosNet === "main") {
        return "https://api5.tzscan.io/v1";
      }
      return "https://api.alphanet.tzscan.io/v1";
    },
    baseNodeApiURL() {
      if (this.tezosNet === "main") {
        return "https://rpc.tezrpc.me/chains/main/blocks";
      }
      return "https://alphanet.tezrpc.me/chains/main/blocks";
    }
  },
  beforeMount() {
    if (window.location.hash) {
      const params = window.location.hash.substring(1).split(":");
      this.tezosNet = params[0];
      this.address = params[1];
      this.explore();
    }
  },
  methods: {
    async explore() {
      await this.initApp();

      window.location.hash = `#${this.tezosNet}:${this.address}`;

      this.isLoading = true;

      const contractsData = await this.getContractsData();
      if (contractsData === undefined) {
        this.notFound = true;
        this.isLoading = false;
        return;
      }

      const { code } = contractsData.script;
      const data = contractsData.script.storage;

      await this.buildSchemas(code);

      this.decoded_data = decode_data(data, this.resultForStorage);
      this.decoded_schema = decode_schema(this.resultForStorage.collapsed_tree);
      this.parameterSchema = decode_schema(this.resultForParameter.collapsed_tree);
      this.groups = await this.buildGroups();

      this.isReady = true;
      this.isLoading = false;
    },
    async initApp() {
      this.isLoading = false;
      this.isReady = false;
      this.notFound = false;
      this.decoded_data = {};
      this.decoded_schema = {};
      this.parameterSchema = {};
      this.resultForParameter = {};
      this.resultForStorage = {};
      this.activetab = 1;
      this.txInfo.morePages = false;
      this.txInfo.currentPage = 0;
      this.txInfo.data = [];
      this.groups = {};
      this.tezaurus = {};
    },
    updateNet(value) {
      this.tezosNet = value;
    },
    updateAddress(value) {
      this.address = value;
    },
    async getContractsData() {
      let res = {};
      await axios
        .get(`${this.baseNodeApiURL}/head/context/contracts/${this.address}`)
        .then(response => {
          res = response.data;
        })
        .catch(() => {
          res = undefined;
        });
      return res;
    },
    isRelated(tx) {
      return tx.kind === "transaction" && [tx.destination, tx.source].includes(this.address);
    },
    async getAllNodeDataByLevels(levels) {
      const links = await this.buildNodeLinksByBlock(levels);
      const promiseArray = links.map(url => axios.get(url));

      const res = [];

      await axios.all(promiseArray).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            args[i].data.forEach(opGroup => {
              opGroup.level = levels[i];
              res.push(opGroup);
            });
          }
        })
      );

      return res;
    },
    async buildNodeLinksByBlock(levels) {
      const links = [];

      levels.forEach(function(level) {
        links.push(`${this.baseNodeApiURL}/${level}/operations/3`);
      }, this);

      return links;
    },
    buildTezaurus(transactions) {
      const tezaurus = {};

      transactions.forEach(tx => {
        const operation = tx.type.operations[0];
        tezaurus[operation.op_level] = operation.timestamp;
      });

      return tezaurus;
    },
    removeDuplicates(tezaurus) {
      const res = {};

      Object.keys(tezaurus).forEach(function(level) {
        if (!(level in this.tezaurus)) {
          res[level] = tezaurus[level];
        }
      }, this);

      return res;
    },
    pushOperationsToGroups(operationGroups) {
      const groups = {};

      operationGroups.forEach(function(group) {
        const operations = [];
        let weFound = false;

        group.contents.forEach(function(operation) {
          if (operation.kind === "transaction") {
            operations.push(operation);
          }

          if (this.isRelated(operation)) {
            weFound = true;
          }

          if (operation.metadata.internal_operation_results != undefined) {
            operation.metadata.internal_operation_results.forEach(function(op) {
              if (op.kind === "transaction") {
                op["internal"] = true;
                operations.push(op);
              }

              if (this.isRelated(op)) {
                weFound = true;
              }
            }, this);
          }
        }, this);

        if (weFound) {
          const groupHash = group.hash;
          const { level } = group;
          const dateObj = new Date(this.tezaurus[level]);

          groups[groupHash] = {
            operations,
            level,
            fee: operations[0]["fee"],
            gasLimit: operations[0]["gas_limit"],
            storageLimit: operations[0]["storage_limit"],
            date: dateObj.toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "2-digit"
            }),
            time: dateObj.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit"
            })
          };
        }
      }, this);

      return groups;
    },
    async buildGroups() {
      const data = await this.getTransactionData();
      let tezaurus = this.buildTezaurus(data);
      tezaurus = this.removeDuplicates(tezaurus);
      const levels = Object.keys(tezaurus).sort((a, b) => b - a);

      const operationGroups = await this.getAllNodeDataByLevels(levels);
      this.tezaurus = Object.assign({}, this.tezaurus, tezaurus);

      const groups = this.pushOperationsToGroups(operationGroups);
      this.buildBigMapAndParams(groups);

      return groups;
    },
    buildBigMapAndParams(groups) {
      Object.keys(groups).forEach(function(hash) {
        groups[hash].operations.forEach(function(operation) {
          if (operation.result != undefined) {
            operation.status = operation.result.status;
            operation.consumedGas = operation.result.consumed_gas;
            operation.paidStorageDiff = operation.result.paid_storage_size_diff;
          } else if (operation.metadata.operation_result != undefined) {
            operation.status = operation.metadata.operation_result.status;
            operation.consumedGas = operation.metadata.operation_result.consumed_gas;
            operation.paidStorageDiff = operation.metadata.operation_result.paid_storage_size_diff;
          }

          if (operation.destination === this.address) {
            if (operation.metadata != undefined) {
              const bigMapDiff = operation.metadata.operation_result.big_map_diff;
              if (bigMapDiff != undefined) {
                operation.decodedBigMapDiff = bigMapDiffDecode(bigMapDiff, this.resultForStorage);
              }
              operation.storage = decode_data(
                operation.metadata.operation_result.storage,
                this.resultForStorage
              );
            }
            if (operation.parameters != undefined) {
              operation.decodedParameters = decode_data(
                operation.parameters,
                this.resultForParameter
              );
            }
          }
        }, this);
      }, this);
    },
    async buildSchemas(code) {
      code.forEach(function(element) {
        if (element.prim === "storage") {
          this.resultForStorage = buildSchema(element);
        }
        if (element.prim === "parameter") {
          this.resultForParameter = buildSchema(element);
        }
      }, this);
    },
    async getTransactionData() {
      const res = await axios.get(
        `${this.baseApiURL}/operations/${this.address}?type=Transaction&number=10&p=${
          this.txInfo.currentPage
        }`
      );

      this.txInfo.morePages = res.data.length === 10;
      this.txInfo.currentPage += 1;

      return res.data;
    },
    demo(item) {
      this.tezosNet = item.net;
      this.address = item.address;
      this.explore();
    },
    async loadMore() {
      this.isLoading = true;

      const newGroups = await this.buildGroups();
      this.groups = Object.assign({}, this.groups, newGroups);

      this.isLoading = false;
    },
    changeTab(value) {
      this.activetab = value;
    }
  }
};

function get_flat_nested(nested) {
  let flat_args = [];

  nested.args.forEach(arg => {
    if (arg instanceof Nested && arg.prim === nested.prim) {
      flat_args = flat_args.concat(get_flat_nested(arg));
    } else {
      flat_args.push(arg);
    }
  });

  return flat_args;
}

function get_route_terminal(route) {
  if (route.value instanceof Route) {
    return get_route_terminal(route.value);
  }
  return route;
}

function allTrue(obj) {
  for (const o in obj) {
    if (!obj[o]) {
      return false;
    }
  }

  return true;
}

function isObject(obj) {
  return obj === Object(obj);
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

class Nested extends Object {}
class Route extends Object {}

function getAnnotation(x, prefix, def = undefined) {
  const ret = [];

  if (x.annots) {
    x.annots.forEach(a => {
      if (a[0] === prefix) {
        ret.push(a.slice(1, a.length));
      }
    });
  }

  return ret.length > 0 ? ret[0] : def;
}

function buildSchema(code) {
  const type_map = {};

  function parseNode(node, path = "0", parent_prim = undefined) {
    if (["storage", "parameter"].includes(node.prim)) {
      return parseNode(node.args[0]);
    }

    type_map[path] = { prim: node.prim };
    const typename = getAnnotation(node, ":");
    let name = getAnnotation(node, "%", typename);

    let args = [];
    const nodeArgs = node.args;

    if (nodeArgs != undefined) {
      Object.keys(nodeArgs).forEach(i => {
        args.push(parseNode(nodeArgs[i], path + i, node.prim));
      });
    }

    if (["pair", "or"].includes(node.prim)) {
      const res = new Nested();
      res.prim = node.prim;
      res.args = args;

      if (typename || parent_prim != node.prim) {
        args = get_flat_nested(res);
        type_map[path].children = args.map(x => x.path);

        const props = args.map(x => x.name);

        if (allTrue(props)) {
          type_map[path].props = props;
        }

        if (typename) {
          type_map[path].name = typename;
        }
      } else {
        return res;
      }
    } else if (node.prim === "option" && name === undefined) {
      name = args[0].name;
    }

    return {
      prim: node.prim,
      path,
      args,
      name
    };
  }

  const collapsed_tree = parseNode(code);
  return {
    type_map,
    collapsed_tree
  };
}

function decode_data(data, schema, annotations = true, literals = true, rootNode = "0") {
  function decode_node(node, path = "0") {
    let res = {};
    let type_info = {};

    if (schema.type_map[path] != undefined) {
      type_info = schema.type_map[path];
    }

    if (isObject(node) && !Array.isArray(node)) {
      const args = [];
      const nodeArgs = node.args;

      if (nodeArgs != undefined) {
        Object.keys(nodeArgs).forEach(i => {
          args.push(decode_node(nodeArgs[i], path + i));
        });
      }

      if (node.prim === "Pair") {
        res = new Nested();
        res.prim = type_info.prim;
        res.args = args;

        if (type_info.children != undefined) {
          res = get_flat_nested(res);

          if (type_info.props != undefined && annotations) {
            const retRes = {};
            for (let i = 0; i < res.length; i++) {
              if (res[i] != undefined) {
                retRes[type_info.props[i]] = res[i];
              }
            }
            res = retRes;
          }
        }
      } else if (["Left", "Right"].includes(node.prim)) {
        const arg_path = path + (node.prim === "Left" ? "0" : "1");
        res = new Route();
        res.path = arg_path;
        res.value = decode_node(node.args[0], arg_path);

        if (type_info.children != undefined) {
          const terminal = get_route_terminal(res);

          if (type_info.props != undefined && annotations === true) {
            const index = type_info.children.indexOf(terminal.path);
            res = {};
            res[type_info.props[index]] = terminal.value;
          } else {
            res = terminal.value;
          }
        }
      } else if (node.prim === "Elt") {
        res = args;
      } else if (node.prim === "Some") {
        res = args[0];
      } else if (node.prim === "None") {
        res = undefined;
      } else if (literals) {
        res = decode_literal(node, type_info.prim);
      } else {
        const key = Object.keys(node)[0];
        res = node[key];
      }
    } else if (Array.isArray(node)) {
      if (["map", "big_map"].indexOf(type_info.prim) != -1) {
        node.forEach(item => {
          const elt = decode_node(item, path);
          res[elt[0]] = elt[1];
        });
      } else {
        const args = [];

        node.forEach(item => {
          args.push(decode_node(item, `${path}0`));
        });

        if (type_info.prim === "set") {
          res = args.filter(onlyUnique);
        } else if (type_info.prim === "list") {
          res = args;
        } else {
          // eslint-disable-next-line
          console.log("Houston we have a problem: ", node, type_info);
        }
      }
    } else {
      // eslint-disable-next-line
      console.log("Houston we have a problem: ", node, type_info);
    }

    return res;
  }

  return decode_node(data, rootNode);
}

function decode_literal(node, prim) {
  const key = Object.keys(node)[0];

  const core_type = key;
  const value = node[key];

  if (["int", "nat"].indexOf(prim) != -1) {
    return parseInt(value);
  }

  if (prim === "timestamp") {
    let date;

    if (core_type === "string") {
      date = new Date(value);
    } else {
      let ts = parseInt(value) * 1000;
      date = new Date(ts);
    }

    return date.toLocaleString("en-GB", { timeZone: "GMT" });
  }
  if (prim === "mutez") {
    return (parseInt(value) / Math.pow(10, 6)).toFixed(6);
  }
  if (prim === "bool") {
    return value === true;
  }
  if (prim === "address" && core_type === "bytes") {
    // eslint-disable-next-line
    console.log("Houston we have a problem: ", prim, core_type, value);
    return value;
  }

  return value;
}

function decode_schema(collapsed_tree) {
  function decode_node(node) {
    if (node.prim === "or") {
      var res = {};

      node.args.forEach((arg, i) => {
        if (arg.name != undefined) {
          res[arg.name] = decode_node(arg);
        } else {
          res[i] = decode_node(arg);
        }
      });

      return res;
    }

    if (node.prim === "pair") {
      let flag = false;
      const values = [];
      let res = {};

      node.args.forEach(arg => {
        if (arg.name === undefined) {
          flag = true;
        }

        const va = decode_node(arg);

        values.push(va);
        res[arg.name] = va;
      });

      return flag ? values : res;
    }

    if (node.prim === "set") {
      return [decode_node(node.args[0])];
    }

    if (node.prim === "list") {
      return [decode_node(node.args[0])];
    }

    if (["map", "big_map"].indexOf(node.prim) != -1) {
      let res = {};
      res[decode_node(node.args[0])] = decode_node(node.args[1]);
      return res;
    }

    if (node.prim === "option") {
      return decode_node(node.args[0]);
    }

    return `#${node.prim}`;
  }

  return decode_node(collapsed_tree);
}

function getBigMapSchema(typeMap) {
  const res = {};
  Object.keys(typeMap).forEach(key => {
    if (typeMap[key].prim === "big_map") {
      res.key_path = `${key.toString()}0`;
      res.val_path = `${key.toString()}1`;
    }
  });

  return res;
}

function bigMapDiffDecode(data, schema) {
  const paths = getBigMapSchema(schema.type_map);
  const res = {};

  data.forEach(item => {
    const key = decode_data(item.key, schema, true, true, paths.key_path);
    const val = decode_data(item.value, schema, true, true, paths.val_path);

    res[key] = val;
  });

  return res;
}
</script>

<style>
.container {
  max-width: 1600px;
  min-width: 420px;
}
</style>
