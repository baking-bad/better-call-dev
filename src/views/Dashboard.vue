<template>
  <div id="app">
    <b-container fluid>
      <Loader :status="isLoading" />
      <b-row>
        <NavBar :address="address" :tezosNet="tezosNet" />
      </b-row>
      <b-row>
        <NotFound :status="notFound" :address="address" :tezosNet="tezosNet" />
        <Results
          v-if="!notFound"
          :address="address"
          :manager="contractManager"
          :script="contractScript"
          :tezosNet="tezosNet"
          :status="isReady"
          :groups="groups"
          :morePages="txInfo.morePages"
          :decodedData="decoded_data"
          :decodedSchema="decoded_schema"
          :parameterSchema="parameterSchema"
          :latestGroup="latestGroup"
          @loadmore="loadMore"
        />
      </b-row>
    </b-container>
  </div>
</template>

<script>
import axios from "axios";
import { bigMapDiffDecode, decodeData, decodeSchema, buildSchema } from "@/app/decode";

import Loader from "@/components/Loader.vue";
import NotFound from "@/components/NotFound.vue";
import Results from "@/components/Results.vue";
import NavBar from "@/components/NavBar.vue";

axios.interceptors.request.use(
  request => {
    let url = request.url;
    if (url.includes("chains/main/blocks") && !url.includes("head")) {
      if (localStorage[url] !== undefined) {
        request.data = JSON.parse(localStorage[url]);

        request.adapter = () => {
          return Promise.resolve({
            data: JSON.parse(localStorage[url]),
            status: request.status,
            statusText: request.statusText,
            headers: request.headers,
            config: request,
            request: request
          });
        };
      }
    }

    return request;
  },
  error => Promise.reject(error)
);

axios.interceptors.response.use(
  response => {
    let url = response.config.url;
    if (url.includes("chains/main/blocks") && !url.includes("head")) {
      localStorage[url] = JSON.stringify(response.data);
    }

    return response;
  },
  error => Promise.reject(error)
);

export default {
  name: "Dashboard",
  components: {
    Loader,
    NotFound,
    Results,
    NavBar
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
    contractManager: "",
    contractScript: "",
    latestGroup: {}
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
        // return "https://mainnet-node.tzscan.io/chains/main/blocks";
        // return "https://rpc.tzbeta.net/chains/main/blocks";
        return "https://rpc.tezrpc.me/chains/main/blocks";
      }
      // return "https://alphanet-node.tzscan.io/chains/main/blocks";
      // return "https://rpcalpha.tzbeta.net/chains/main/blocks";
      return "https://tezos-dev.cryptonomic-infra.tech/chains/main/blocks";
    }
  },
  watch: {
    "$route.params": function() {
      this.tezosNet = this.$router.history.current.params.network;
      this.address = this.$router.history.current.params.address;
      this.explore();
    }
  },
  beforeMount() {
    this.tezosNet = this.$router.history.current.params.network;
    this.address = this.$router.history.current.params.address;
    this.explore();
  },
  methods: {
    async explore() {
      await this.initApp();

      this.isLoading = true;

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
      this.contractScript = contractsData.script;

      await this.buildSchemas(code);

      this.decoded_data = decodeData(data, this.resultForStorage);
      this.decoded_schema = decodeSchema(this.resultForStorage.collapsed_tree);
      this.parameterSchema = decodeSchema(this.resultForParameter.collapsed_tree);
      this.groups = await this.buildGroups();
      if (Object.keys(this.groups).length > 0) {
        this.handleFirstTx();
      }

      this.isLoading = false;
      this.isReady = true;
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
      this.bigMapJsonPath = "";
      this.txInfo.morePages = false;
      this.txInfo.currentPage = 0;
      this.txInfo.data = [];
      this.groups = {};
      this.tezaurus = {};
      this.contractBalance = 0;
      this.contractManager = "";
      this.contractScript = {};
      this.latestGroup = {};
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
      return [tx.destination, tx.source].includes(this.address);
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
          if (!["transaction", "origination", "delegation"].includes(operation.kind)) {
            return;
          }

          operations.push(operation);
          if (this.isRelated(operation)) {
            weFound = true;
          }

          if (operation.metadata.internal_operation_results != undefined) {
            operation.metadata.internal_operation_results.forEach(function(op) {
              op["internal"] = true;
              operations.push(op);

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
    handleFirstTx() {
      let firstHash = Object.keys(this.groups)[0];
      let firstGroup = this.groups[firstHash];
      this.latestGroup = firstGroup;

      firstGroup.operations.forEach(function(tx) {
        if (tx.destination == this.address) {
          tx.expand = true;
          return;
        }
      }, this);
    },
    async buildGroups() {
      let data = await this.getTransactionData();
      if (data.length === 0) {
        return {};
      }

      let tezaurus = this.buildTezaurus(data);
      tezaurus = this.removeDuplicates(tezaurus);
      const levels = Object.keys(tezaurus).sort((a, b) => b - a);

      const operationGroups = await this.getAllNodeDataByLevels(levels);
      this.tezaurus = Object.assign({}, this.tezaurus, tezaurus);

      let groups = this.pushOperationsToGroups(operationGroups);
      if (Object.keys(groups).length > 0) {
        this.buildBigMapAndParams(groups);
        groups = await this.getOldStorage(groups);
      }

      return groups;
    },
    buildPostLinksForNode(miniTezaurus, block) {
      const links = [];

      Object.keys(miniTezaurus).forEach(function(key) {
        links.push({
          link: `${this.baseNodeApiURL}/${block}/context/contracts/${this.address}/big_map_get?key=${key}`,
          postParams: JSON.stringify(miniTezaurus[key]),
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
      let miniTezaurusRaw = bigMapDiffDecode(result, this.resultForStorage);
      let miniTezaurus = this.dropNullFromObject(miniTezaurusRaw);

      let currentStorage = {};
      let currentStorageSize = "0";
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
            currentStorageSize = tx.storageSize;

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

        if (group.storageSize === undefined) {
          group.storageSize = currentStorageSize;
        }
      }

      if (Object.keys(miniTezaurus).length > 0) {
        let validTezaurus = this.buildValidTezaurus(this.decoded_data, miniTezaurus, [
          ...this.bigMapJsonPath
        ]);
        this.decoded_data = this.mergeTezaurusToStorage(
          this.decoded_data,
          this.dropNullFromObject(validTezaurus)
        );
      }

      return groups;
    },
    buildValidTezaurus(decodedData, miniTezaurus, jsonPath) {
      let current = {};
      for (let i = 0; i < jsonPath.length; i++) {
        let key = jsonPath[i];
        current = decodedData[key];
      }

      if (current === undefined) {
        current = {};
      }

      let whiteListKeys = Object.keys(current);
      let validTezaurus = {};

      Object.keys(miniTezaurus).forEach(function(key) {
        if (!whiteListKeys.includes(key)) {
          validTezaurus = { ...validTezaurus, [key]: miniTezaurus[key] };
        }
      });

      return validTezaurus;
    },
    buildBigMapTezaurus(groups, hashes) {
      let tezaurus = {};

      for (let i = 0; i < hashes.length; i++) {
        let group = groups[hashes[i]];
        group["operations"].forEach(function(tx) {
          if (tx.decodedBigMapDiff) {
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
    changeBalance(balanceUpdates, address) {
      if (balanceUpdates === undefined) {
        return 0;
      }
      let changes = 0;

      balanceUpdates.forEach(function(balance) {
        if (balance.kind === "contract" && balance.contract === address) {
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
            op.consumedGas = op.result.consumed_gas || 0;
            op.paidStorageDiff = op.result.paid_storage_size_diff || 0;
            op.expand = false;
            currentBalanceChange += this.changeBalance(op.result.balance_updates, this.address);

            if (op.kind === "origination") {
              if (op.result.originated_contracts != undefined) {
                op.destination = op.result.originated_contracts[0];
                op.amount = this.changeBalance(op.result.balance_updates, op.destination);
              }
            } else if (op.kind === "delegation") {
              op.destination = op.delegate || "unset".padEnd(36, " ");
            }
            if (op.destination === this.address) {
              op.rawStorage = op.result.storage;
              op.bigMapDiff = op.result.big_map_diff;
              op.storageSize = op.result.storage_size;
            }
          } else if (op.metadata.operation_result != undefined) {
            op.status = op.metadata.operation_result.status;
            op.errors = this.getUniqueErrors(op.metadata.operation_result.errors, op.status);
            op.consumedGas = op.metadata.operation_result.consumed_gas || 0;
            op.paidStorageDiff = op.metadata.operation_result.paid_storage_size_diff || 0;
            op.expand = false;
            currentBalanceChange += this.changeBalance(
              op.metadata.operation_result.balance_updates,
              this.address
            );

            if (op.kind === "origination") {
              op.destination = op.metadata.operation_result.originated_contracts[0];
              op.amount = this.changeBalance(
                op.metadata.operation_result.balance_updates,
                op.destination
              );
            }
            if (op.destination === this.address) {
              op.rawStorage = op.metadata.operation_result.storage;
              op.bigMapDiff = op.metadata.operation_result.big_map_diff;
              op.storageSize = op.metadata.operation_result.storage_size;
            }
          }

          if (op.destination === this.address) {
            groups[hash].storageSize = op.storageSize;
            if (op.rawStorage !== undefined) {
              op.storage = decodeData(op.rawStorage, this.resultForStorage);
            }
            if (op.bigMapDiff !== undefined) {
              op.decodedBigMapDiff = bigMapDiffDecode(op.bigMapDiff, this.resultForStorage);
            }
            if (op.parameters !== undefined) {
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
    dropNullFromObject(obj) {
      let diff = {};

      Object.keys(obj).forEach(function(key) {
        let value = obj[key];
        if (value !== null) {
          diff[key] = value;
        }
      });

      return diff;
    },
    mergeBigMapToStorage(storage, decodedBigMapDiff) {
      let current = storage;
      let diff = this.dropNullFromObject(decodedBigMapDiff);

      for (let i = 0; i < this.bigMapJsonPath.length; i++) {
        let key = this.bigMapJsonPath[i];

        if (i + 1 === this.bigMapJsonPath.length) {
          current[key] = Object.assign(current[key], diff);
          break;
        }

        current = current[key];
      }

      return current;
    },
    mergeTezaurusToStorage(storage, tezaurus) {
      let current = Object.assign({}, storage);

      for (let i = 0; i < this.bigMapJsonPath.length; i++) {
        let key = this.bigMapJsonPath[i];

        if (i + 1 === this.bigMapJsonPath.length) {
          current[key] = Object.assign({}, current[key], tezaurus);
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
        `${this.baseApiURL}/operations/${this.address}?type=Transaction&number=10&p=${this.txInfo.currentPage}`
      );

      this.txInfo.morePages = res.data.length === 10;
      this.txInfo.currentPage += 1;

      return res.data;
    },
    async getOrigination() {
      const acc_res = await axios.get(`${this.baseApiURL}/v1/account_status/${this.address}`);
      let op_hash = acc_res.data.origination;
      const op_res = await axios.get(`${this.baseApiURL}/v1/operation/${op_hash}`);
      let operations = op_res.data.type.operations;
      return operations;
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

html {
  min-width: 1280px;
}

body {
  font-family: "Roboto", sans-serif;
  font-weight: 300;
}
</style>
