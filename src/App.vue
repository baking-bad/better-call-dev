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
import { bigMapDiffDecode, decodeData, decodeSchema, buildSchema } from "@/app/decode";

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
    bigMapJsonPath: "",
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
        return "https://rpc.tzbeta.net/chains/main/blocks";
      }
      return "https://alphanet-node.tzscan.io/chains/main/blocks";
      // return "https://rpcalpha.tzbeta.net/chains/main/blocks";
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

      const code = contractsData.script.code;
      const data = contractsData.script.storage;

      await this.buildSchemas(code);

      console.log(this.resultForStorage);

      this.decoded_data = decodeData(data, this.resultForStorage);
      this.decoded_schema = decodeSchema(this.resultForStorage.collapsed_tree);
      this.parameterSchema = decodeSchema(this.resultForParameter.collapsed_tree);
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

      let groups = this.pushOperationsToGroups(operationGroups);
      this.buildBigMapAndParams(groups);
      groups = await this.getOldStorage(groups);

      return groups;
    },
    buildPostLinksForNode(miniTezaurus, block) {
      const links = [];

      Object.keys(miniTezaurus).forEach(function(key) {
        miniTezaurus[key].forEach(function(bigMap) {
          links.push({
            link: `${this.baseNodeApiURL}/${block}/context/contracts/${this.address}/big_map_get`,
            postParams: {
              key: bigMap["key"],
              type: {
                prim: Object.keys(bigMap["key"])[0]
              }
            },
            headers: {
              headers: { "Content-Type": "application/json" }
            },
            key: key
          });
        }, this);
      }, this);

      return links;
    },
    async getAllBigMapFromNode(links) {
      let promiseArray = links.map(l => axios.post(l.link, l.postParams, l.headers));

      let res = {};

      await axios.all(promiseArray).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            if (args[i].data !== null) {
              let key = links[i]["key"];
              res[key] = args[i].data;
            }
          }
        })
      );

      return res;
    },
    async getOldStorage(groups) {
      let hashes = Object.keys(groups).reverse();
      let firstHash = hashes[0];
      let prevBlock = groups[firstHash]["level"] - 1;

      let keys = this.buildBigMapTezaurus(groups, hashes);
      let links = this.buildPostLinksForNode(keys, prevBlock);
      let miniTezaurus = await this.getAllBigMapFromNode(links);

      Object.keys(miniTezaurus).forEach(function(item) {
        miniTezaurus[item] = bigMapDiffDecode(miniTezaurus[item], this.resultForStorage);
      }, this);

      console.log("keys:", miniTezaurus);

      let currentStorage = {};
      await axios
        .get(`${this.baseNodeApiURL}/${prevBlock}/context/contracts/${this.address}`)
        .then(response => {
          currentStorage = response.data.script.storage;
        })
        .catch(error => {
          // eslint-disable-next-line
          console.log(error);
        });

      currentStorage = decodeData(currentStorage, this.resultForStorage);
      groups[firstHash]["operations"][0]["prevStorage"] = currentStorage;

      for (let i = 0; i < hashes.length; i++) {
        let group = groups[hashes[i]];
        group["operations"].forEach(function(tx) {
          if (tx.status === "applied" && tx.destination === this.address) {
            tx.prevStorage = currentStorage;
            currentStorage = tx.storage;
            console.log("DO:", currentStorage);

            tx.storage = this.mergeBigMapToStorage(tx.storage, tx.decodedBigMapDiff);
            console.log("POSLE", currentStorage);

            Object.keys(tx.decodedBigMapDiff).forEach(function(key) {
              if (miniTezaurus[key] !== undefined) {
                tx.prevStorage = this.mergeBigMapToStorage(tx.prevStorage, miniTezaurus[key]);
              }

              miniTezaurus[key] = tx.decodedBigMapDiff;
            }, this);
          }
        }, this);
      }

      return groups;
    },
    buildBigMapTezaurus(groups, hashes) {
      let tezaurus = {};

      for (let i = 0; i < hashes.length; i++) {
        let group = groups[hashes[i]];
        group["operations"].forEach(function(tx) {
          if (tx.status === "applied" && tx.destination === this.address) {
            Object.keys(tx.decodedBigMapDiff).forEach(function(key) {
              if (tezaurus[key] === undefined) {
                tezaurus[key] = tx.bigMapDiff;
              }
            });
          }
        }, this);
      }

      return tezaurus;
    },
    buildBigMapAndParams(groups) {
      Object.keys(groups).forEach(function(hash) {
        groups[hash].operations.forEach(function(op) {
          if (op.result != undefined) {
            op.status = op.result.status;
            op.consumedGas = op.result.consumed_gas;
            op.paidStorageDiff = op.result.paid_storage_size_diff;
            op.storageSize = op.result.storage_size;
          } else if (op.metadata.operation_result != undefined) {
            op.status = op.metadata.operation_result.status;
            op.consumedGas = op.metadata.operation_result.consumed_gas;
            op.paidStorageDiff = op.metadata.operation_result.paid_storage_size_diff;
            op.storageSize = op.metadata.operation_result.storage_size;
          }

          if (op.destination === this.address) {
            if (op.metadata != undefined) {
              const bigMapDiff = op.metadata.operation_result.big_map_diff;
              if (bigMapDiff != undefined) {
                op.bigMapDiff = bigMapDiff;
                op.decodedBigMapDiff = bigMapDiffDecode(bigMapDiff, this.resultForStorage);
              }
              op.storage = decodeData(op.metadata.operation_result.storage, this.resultForStorage);
              // op.storage = this.mergeBigMapToStorage(op.storage, op.decodedBigMapDiff);
            }
            if (op.parameters != undefined) {
              op.decodedParameters = decodeData(op.parameters, this.resultForParameter);
            }
          }
        }, this);
      }, this);
    },
    mergeBigMapToStorage(storage, decodedBigMapDiff) {
      let current = storage;

      for (let i = 0; i < this.bigMapJsonPath.length; i++) {
        let key = this.bigMapJsonPath[i];

        if (i + 1 === this.bigMapJsonPath.length) {
          current[key] = Object.assign(current[key], decodedBigMapDiff);
          break;
        }

        current = current[key];
      }

      return current;
    },
    getBigMapPath(typeMap) {
      let res = "";
      Object.keys(typeMap).forEach(function(path) {
        if (typeMap[path]["prim"] === "big_map") {
          res = path;
          return;
        }
      });

      return res;
    },
    getJsonPath(typeMap, path) {
      let typeInfo = typeMap[path[0]];
      let jsonPath = [];

      path
        .substring(1)
        .split("")
        .forEach(function(i) {
          let index = parseInt(i);

          if (typeInfo["props"] !== undefined) {
            jsonPath.push(typeInfo["props"][index]);
          } else {
            jsonPath.push(i);
          }

          typeInfo = typeMap[typeInfo["children"][index]];
        });

      return jsonPath;
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

      let binaryPath = this.getBigMapPath(this.resultForStorage.type_map);
      this.bigMapJsonPath = this.getJsonPath(this.resultForStorage.type_map, binaryPath);
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
</script>

<style>
.container {
  max-width: 1600px;
  min-width: 420px;
}
</style>
