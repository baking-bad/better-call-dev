<template>
  <div id="app">
    <b-container>
      <Loader :status="isLoading"/>
      <b-row v-if="isLanding">
        <Landing
          :demoAddresses="demoAddresses"
          @updateNet="updateNet"
          @update="updateAddress"
          @explore="explore"
          @demo="demo"
        />
      </b-row>
      <b-row v-if="!isLanding">
        <NavBar
          :address="address"
          :tezosNet="tezosNet"
          :demoAddresses="demoAddresses"
          @update="updateAddress"
          @updateNet="updateNet"
          @explore="explore"
          @demo="demo"
        />
      </b-row>
      <b-row>
        <NotFound :status="notFound"/>
        <Results
          v-if="!notFound"
          :address="address"
          :manager="contractManager"
          :tezosNet="tezosNet"
          :status="isReady"
          :groups="groups"
          :morePages="txInfo.morePages"
          :decodedData="decoded_data"
          :decodedSchema="decoded_schema"
          :parameterSchema="parameterSchema"
          @loadmore="loadMore"
        />
      </b-row>
    </b-container>
  </div>
</template>

<script>
import axios from "axios";
import { bigMapDiffDecode, decodeData, decodeSchema, buildSchema } from "@/app/decode";

import Loader from "./components/Loader.vue";
import NotFound from "./components/NotFound.vue";
import Results from "./components/Results.vue";
import NavBar from "./components/NavBar.vue";
import Landing from "./components/Landing.vue";

export default {
  name: "app",
  components: {
    Loader,
    NotFound,
    Results,
    NavBar,
    Landing
  },
  data: () => ({
    isLoading: false,
    address: "",
    tezosNet: "alpha",
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
    tezaurus: {},
    contractBalance: 0,
    isLanding: true,
    demoAddresses: [
      {
        net: "alpha",
        address: "KT1SufMDx6d2tuVe3n6tSYUBNjtV9GgaLgtV"
      },
      {
        net: "alpha",
        address: "KT1FU74GimCeEVRAEZGURb6TWU8jK1N6zFJy"
      },
      {
        net: "alpha",
        address: "KT19iGCL4YrVpT6ezEzbDH37Yxbas8jWQz4s"
      },
      {
        net: "alpha",
        address: "KT1QiAJocHUKYN29BegaCnCaSQ9FT2ZXGfuJ"
      },
      {
        net: "alpha",
        address: "KT1HnvV5Z53naoh51jYvPF7w168nW8nfyx5v"
      },
      {
        net: "alpha",
        address: "KT19yAMFum5MmD99kusQiCBGpTEVC1B52f9Q"
      },
      {
        net: "alpha",
        address: "KT1Sefu81jFomBUTiJgK6VvCyY5rGrkhPszt"
      },
      {
        net: "alpha",
        address: "KT1TpKkwKzGwMrWrGnPp9KixhraD2dtE5wE5"
      },
      {
        net: "alpha",
        address: "KT1P3j1VonQytW3b2SzCnGVpjdf3oWajM79E"
      },
      {
        net: "alpha",
        address: "KT1XtauF2tnmAKBzbLA2gNoMji9zSzSyYq9w"
      },
      {
        net: "alpha",
        address: "KT1Qx7PRNAVHgam1qb2MuJohggnSdHTeBWyc"
      },
      {
        net: "main",
        address: "KT1Q1kfbvzteafLvnGz92DGvkdypXfTGfEA3"
      },
      {
        net: "main",
        address: "KT1BvVxWM6cjFuJNet4R9m64VDCN2iMvjuGE"
      },
      {
        net: "main",
        address: "KT1GgUJwMQoFayRYNwamRAYCvHBLzgorLoGo"
      }
    ]
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
      this.isLanding = false;

      const contractsData = await this.getContractsData();
      if (contractsData === undefined || contractsData.script === undefined) {
        this.notFound = true;
        this.isLoading = false;
        this.isReady = true;
        return;
      }

      const code = contractsData.script.code;
      const data = contractsData.script.storage;
      this.contractBalance = parseInt(contractsData.balance);
      this.contractManager = contractsData.manager;

      await this.buildSchemas(code);

      this.decoded_data = decodeData(data, this.resultForStorage);
      this.decoded_schema = decodeSchema(this.resultForStorage.collapsed_tree);
      this.parameterSchema = decodeSchema(this.resultForParameter.collapsed_tree);
      this.groups = await this.buildGroups();
      this.expandFirstTx();

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
      this.txInfo.morePages = false;
      this.txInfo.currentPage = 0;
      this.txInfo.data = [];
      this.groups = {};
      this.tezaurus = {};
      this.contractBalance = 0;
      this.contractManager = "";
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
    expandFirstTx() {
      let firstHash = Object.keys(this.groups)[0];
      this.groups[firstHash].operations.forEach(function(tx) {
        if (tx.destination == this.address) {
          tx.expand = true;
          return;
        }
      }, this);
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
        links.push({
          link: `${this.baseNodeApiURL}/${block}/context/contracts/${this.address}/big_map_get`,
          postParams: miniTezaurus[key],
          headers: {
            headers: { "Content-Type": "application/json" }
          },
          key: miniTezaurus[key].key
        });
      }, this);

      return links;
    },
    async getAllBigMapFromNode(links) {
      let promiseArray = links.map(l => axios.post(l.link, l.postParams, l.headers));

      let res = [];

      await axios.all(promiseArray).then(
        axios.spread((...args) => {
          for (let i = 0; i < args.length; i++) {
            if (args[i].data !== null) {
              res.push({
                key: links[i]["key"],
                value: args[i].data
              });
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
      let result = await this.getAllBigMapFromNode(links);
      let miniTezaurus = bigMapDiffDecode(result, this.resultForStorage);

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
          tx.prevStorage = JSON.parse(JSON.stringify(currentStorage));
          if (tx.status === "applied" && tx.destination === this.address) {
            currentStorage = JSON.parse(JSON.stringify(tx.storage));

            if (tx.decodedBigMapDiff) {
              tx.storage = this.mergeBigMapToStorage(tx.storage, tx.decodedBigMapDiff);

              Object.keys(tx.decodedBigMapDiff).forEach(function(key) {
                if (miniTezaurus[key] !== undefined) {
                  let temp = {};
                  temp[key] = miniTezaurus[key];
                  tx.prevStorage = this.mergeBigMapToStorage(tx.prevStorage, temp);
                }

                miniTezaurus[key] = tx.decodedBigMapDiff[key];
              }, this);
            }
          }
        }, this);
      }

      this.mergeBigMapToStorage(this.decoded_data, miniTezaurus);
      return groups;
    },
    buildBigMapTezaurus(groups, hashes) {
      let tezaurus = {};

      for (let i = 0; i < hashes.length; i++) {
        let group = groups[hashes[i]];
        group["operations"].forEach(function(tx) {
          if (tx.bigMapDiff) {
            tx.bigMapDiff.forEach(function(item) {
              let key = item.key[Object.keys(item.key)[0]];
              let type = { prim: this.resultForStorage.type_map["000"]["prim"] };
              tezaurus[key] = {
                key: item.key,
                type: type
              };
            }, this);
          }
        }, this);
      }

      return tezaurus;
    },
    getUniqueErrors(errors, status) {
      if (status !== "failed") {
        return [];
      }

      let ret = [];
      let seenErr = [];

      errors.forEach(function(err) {
        if (!seenErr.includes(err.id)) {
          let id = err.id;
          let msg = "";
          if (err.with !== undefined) {
            // To-Do: decoded with
            msg = decodeData(err.with, null);
          }
          ret.push({ id: id, msg: msg });
          seenErr.push(id);
        }
      }, this);

      return ret;
    },
    changeBalance(balanceUpdates) {
      if (balanceUpdates === undefined) {
        return 0;
      }
      let changes = 0;

      balanceUpdates.forEach(function(balance) {
        if (balance.kind === "contract" && balance.contract === this.address) {
          changes += parseInt(balance.change);
        }
      }, this);

      return changes;
    },
    buildBigMapAndParams(groups) {
      let currentBalanceChange;

      Object.keys(groups).forEach(function(hash) {
        groups[hash].balance = this.contractBalance;
        currentBalanceChange = 0;

        groups[hash].operations.forEach(function(op) {
          if (op.result != undefined) {
            op.status = op.result.status;
            op.errors = this.getUniqueErrors(op.result.errors, op.status);
            op.consumedGas = op.result.consumed_gas;
            op.paidStorageDiff = op.result.paid_storage_size_diff;
            op.storageSize = op.result.storage_size;
            op.expand = false;
            currentBalanceChange += this.changeBalance(op.result.balance_updates);
          } else if (op.metadata.operation_result != undefined) {
            op.status = op.metadata.operation_result.status;
            op.errors = this.getUniqueErrors(op.metadata.operation_result.errors, op.status);
            op.consumedGas = op.metadata.operation_result.consumed_gas;
            op.paidStorageDiff = op.metadata.operation_result.paid_storage_size_diff;
            op.storageSize = op.metadata.operation_result.storage_size;
            op.expand = false;
            currentBalanceChange += this.changeBalance(
              op.metadata.operation_result.balance_updates
            );
          }

          if (op.destination === this.address) {
            groups[hash].storageSize = op.storageSize;
            if (op.metadata != undefined) {
              const bigMapDiff = op.metadata.operation_result.big_map_diff;
              if (bigMapDiff != undefined) {
                op.bigMapDiff = bigMapDiff;
                op.decodedBigMapDiff = bigMapDiffDecode(bigMapDiff, this.resultForStorage);
              }
              op.storage = decodeData(op.metadata.operation_result.storage, this.resultForStorage);
            }
            if (op.parameters != undefined) {
              if (op.errors.length > 0 && op.errors[0].id.endsWith("badContractParameter")) {
                op.decodedParameters = decodeData(op.parameters, null);
              } else {
                op.decodedParameters = decodeData(op.parameters, this.resultForParameter);
              }
            }
          }
        }, this);

        this.contractBalance -= currentBalanceChange;
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

      if (
        this.resultForStorage.type_map["00"] !== undefined &&
        this.resultForStorage.type_map["00"]["prim"] === "big_map"
      ) {
        this.bigMapJsonPath = this.getJsonPath(this.resultForStorage.type_map, "00");
      }
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
    }
  }
};
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Roboto:300,400");
@import url("https://fonts.googleapis.com/css?family=Roboto+Mono:300,400");

body {
  font-family: "Roboto", sans-serif;
  font-weight: 300;
}

.container {
  max-width: 1600px;
  min-width: 1024px;
}
</style>
