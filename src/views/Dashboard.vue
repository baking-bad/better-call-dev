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
          :delegate="contractDelegate"
          :script="contractScript"
          :tezosNet="tezosNet"
          :status="isReady"
          :groups="groups"
          :morePages="txInfo.morePages"
          :decodedData="decoded_data"
          :decodedSchema="decoded_schema"
          :parameterSchema="parameterSchemaView"
          :latestGroup="latestGroup"
          @loadmore="loadMore"
        />
      </b-row>
    </b-container>
  </div>
</template>

<script>
import {
  decodeParameters,
  decodeData,
  decodeSchema,
  buildSchema,
} from "@/app/decode";
import {
  ConseilQueryBuilder,
  ConseilOperator,
  ConseilSortDirection,
  ConseilDataClient
} from "conseiljs";
import { setupConseil } from "@/app/conseil";
import { get, post } from "@/app/http";
import lscache from "lscache";
import utils from "@/app/utils";

import Loader from "@/components/Loader.vue";
import NotFound from "@/components/NotFound.vue";
import Results from "@/components/Results.vue";
import NavBar from "@/components/NavBar.vue";
import { NetConfig } from "../netConfig";

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
    tezosNet: "main",
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
    tezaurus: {},
    contractBalance: 0,
    contractManager: "",
    contractDelegate: "",
    contractScript: "",
    isPayoutContract: false,
    latestGroup: {},
    blockData: []
  }),
  computed: {
    baseApiURL() {
      return this.tzScanUrl();
    },
    baseNodeApiURL() {
      return this.blockUrl();
    }
  },
  watch: {
    "$route.params": function() {
      let net = this.$router.history.current.params.network;
      let adr = this.$router.history.current.params.address;

      if (this.tezosNet !== net || this.address !== adr) {
        this.tezosNet = net;
        this.address = adr;
        this.explore();
      }
    }
  },
  beforeMount() {
    this.tezosNet = this.$router.history.current.params.network;
    this.address = this.$router.history.current.params.address;
    this.explore();
  },
  methods: {
    netConfig() {
      return new NetConfig(this.tezosNet);
    },
    tzScanUrl() {
      return this.netConfig().tzScanUrl();
    },
    tzStatsUrl() {
      return this.netConfig().tzStatsUrl();
    },
    blockUrl() {
      if (this.$route.query.blockUrl !== undefined) {
        return decodeURI(this.$route.query.blockUrl);
      } else {
        return this.netConfig().blockUrl();
      }
    },
    implementsConseil() {
      return this.netConfig().implementsConseil();
    },
    implementsTzStats() {
      return this.netConfig().implementsTzStats();
    },
    getStorageSchema(blockLevel) {
      if (this.tezosNet == "main") {
        if (blockLevel > 655359) {
          return this.storageSchema.babylon;
        } else {
          return this.storageSchema.athens;
        }
      } else {
        return this.storageSchema.babylon;
      }
    },
    getParameterSchema(blockLevel) {
      if (this.tezosNet == "main") {
        if (blockLevel > 655359) {
          return this.parameterSchema.babylon;
        } else {
          return this.parameterSchema.athens;
        }
      } else {
        return this.parameterSchema.babylon;
      }
    },
    async explore() {
      await this.initApp();

      this.isLoading = true;

      const contractsData = await this.getContractsData('head');
      if (contractsData === undefined || contractsData.script === undefined) {
        this.notFound = true;
        this.isLoading = false;
        this.isReady = true;
        return;
      }

      const code = contractsData.script.code;
      const data = contractsData.script.storage;
      this.contractBalance = parseInt(contractsData.balance);
      this.contractScript = contractsData.script;
      this.contractDelegate = contractsData.delegate;
      this.isPayoutContract = this.checkPayoutSignature(code);

      if (contractsData.delegate && contractsData.delegate.setable !== undefined) {
        this.contractDelegate = contractsData.delegate.value;
      }

      let athensCode = null;
      if (this.tezosNet == "main") {
        const contractsDataAthens = await this.getContractsData('655359');
        if (contractsDataAthens !== undefined && contractsDataAthens.script !== undefined) {
          athensCode = contractsDataAthens.script.code;
        }
      }

      this.parameterSchema = {
        babylon: buildSchema(code[0]),
        athens: athensCode? buildSchema(athensCode[0]) : null
      }
      this.storageSchema = {
        babylon: buildSchema(code[1]),
        athens: athensCode? buildSchema(athensCode[1]) : null
      }

      this.decoded_data = decodeData(data, this.storageSchema.babylon);
      this.decoded_schema = decodeSchema(this.storageSchema.babylon.collapsed_tree);
      this.parameterSchemaView = decodeSchema(this.parameterSchema.babylon.collapsed_tree);

      this.groups = await this.buildGroups();
      if (Object.keys(this.groups).length > 0) {
        this.handleFirstTx();
      }

      this.isLoading = false;
      this.isReady = true;
    },
    async initApp() {
      if (!localStorage["WASTED"]) {
        localStorage.clear();
        localStorage["WASTED"] = true;
      }

      lscache.flushExpired();

      this.isLoading = false;
      this.isReady = false;
      this.notFound = false;
      this.decoded_data = {};
      this.decoded_schema = {};
      this.parameterSchemaView = {};
      this.parameterSchema = {};
      this.storageSchema = {};
      this.txInfo.morePages = false;
      this.txInfo.currentPage = 0;
      this.txInfo.data = [];
      this.groups = {};
      this.tezaurus = {};
      this.contractBalance = 0;
      this.contractManager = "";
      this.contractDelegate = "";
      this.contractScript = {};
      this.isPayoutContract = false;
      this.latestGroup = {};
      this.blockData = [];
    },
    updateNet(value) {
      this.tezosNet = value;
    },
    updateAddress(value) {
      this.address = value;
    },
    async getContractsData(blockId) {
      return await get(`${this.baseNodeApiURL}/${blockId}/context/contracts/${this.address}`);
    },
    isValidOperation(operation) {
      let isOrignation = operation.kind === "origination";
      let isDelegation = operation.kind === "delegation";
      let isTranscation = operation.kind === "transaction";

      if (this.isPayoutContract) {
        isTranscation = this.checkRelatedPayoutTx(operation);
      }

      return isOrignation || isDelegation || isTranscation;
    },
    checkRelatedPayoutTx(operation) {
      if (operation.kind !== "transaction") {
        return true;
      }

      if (operation.parameters !== undefined) {
        return true;
      }

      if (this.isRelated(operation)) {
        return true;
      }

      return false;
    },
    isRelated(tx) {
      return [tx.destination, tx.source].includes(this.address) || this.isRelatedOrigination(tx);
    },
    isRelatedOrigination(tx) {
      if (tx.kind === "origination") {
        if (tx.internal) {
          if (tx.result.status === "applied") {
            return tx.result.originated_contracts.includes(this.address);
          } else {
            return false;
          }
        } else {
          if (tx.metadata.operation_result.status === "applied") {
            return tx.metadata.operation_result.originated_contracts.includes(this.address);
          } else {
            return false;
          }
        }
      }

      return false;
    },
    async getAllNodeDataByLevels(levels) {
      const links = await this.buildNodeLinksByBlock(levels);
      const promiseArray = links.map(url => get(url));
      const res = [];

      let items = await Promise.all(promiseArray);

      for (let i = 0; i < items.length; i++) {
        items[i].forEach(opGroup => {
          opGroup.level = levels[i];
          res.push(opGroup);
        });
      }

      return res;
    },
    async buildNodeLinksByBlock(levels) {
      const links = [];

      levels.forEach(function(level) {
        links.push(`${this.baseNodeApiURL}/${level}/operations/3`);
      }, this);

      return links;
    },
    async buildTezaurus() {
      let tezaurus = {};
      let data = {};

      if (this.implementsTzStats()) {
        data = await this.getTzStatsTransactionData();
        data.forEach(tx => {
          tezaurus[tx[0]] = tx[1]
        });
      } else if (this.implementsConseil()) {
        data = await this.getConseilTransactionData();
        data.forEach(tx => {
          tezaurus[tx.block_level] = tx.timestamp;
        });
      } else {
        throw "Cannot build tezaurus";
      }

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
    pushOperationsToGroups(operationGroups, level = 0) {
      const groups = {};

      operationGroups.forEach(function(group) {
        const operations = [];
        const lvl = level > 0 ? level : group.level;
        let fee = 0;
        let gasLimit = 0;
        let storageLimit = 0;
        let weFound = false;

        group.contents.forEach(function(operation) {
          if (!["transaction", "origination", "delegation"].includes(operation.kind)) {
            return;
          }

          if (this.isValidOperation(operation)) {
            if (this.isPayoutContract) {
              operation.reward = true;
            }
            operations.push(operation);
            fee += parseInt(operation.fee);
            gasLimit += parseInt(operation.gas_limit);
            storageLimit += parseInt(operation.storage_limit);

            if (this.isRelated(operation)) {
              weFound = true;
            }
          }

          if (operation.metadata.internal_operation_results !== undefined) {
            operation.metadata.internal_operation_results.forEach(function(op) {
              if (this.isValidOperation(op)) {
                if (this.isPayoutContract) {
                  op.reward = true;
                }
                op.internal = true;
                operations.push(op);

                if (this.isRelated(op)) {
                  weFound = true;
                }
              }
            }, this);
          }
        }, this);

        if (weFound) {
          const groupHash = group.hash;
          const dateObj = new Date(this.tezaurus[lvl]);

          groups[groupHash] = {
            operations,
            level: lvl,
            fee: fee,
            gasLimit: gasLimit,
            storageLimit: storageLimit,
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
      let groups = {};

      if (this.tezosNet === "sandbox") {
        groups = await this.getSandboxData();
      } else {
        let tezaurus = await this.buildTezaurus();
        if (Object.keys(tezaurus).length == 0) {
          return {};
        }
        this.tezaurus = Object.assign({}, this.tezaurus, tezaurus);

        const levels = Object.keys(tezaurus).sort((a, b) => b - a);
        const operationGroups = await this.getAllNodeDataByLevels(levels);
        groups = this.pushOperationsToGroups(operationGroups);
      }

      if (Object.keys(groups).length > 0) {
        this.buildBigMapAndParams(groups);
        groups = await this.getOldStorage(groups);
      }

      return groups;
    },
    async getBigMapPrev(bigMapDiff, blockLevel) {
      const links = [];
      bigMapDiff.forEach(change => {
        if (change.action === "alloc") {
          return;
        }
        if (change.big_map !== undefined) {
          links.push({
            link: `${this.baseNodeApiURL}/${blockLevel}/context/big_maps/${change.big_map}/${change.key_hash}`,
            big_map: change.big_map,
            key: change.key
          });
        } else {
          links.push({
            link: `${this.baseNodeApiURL}/${blockLevel}/context/contracts/${this.address}/big_map_get?key=${change.key_hash}`,
            postParams: {
              key: change.key,
              type: this.getStorageSchema(blockLevel).type_map["000"]
            },
            key: change.key
          });
        }
      });

      let promiseArray = links.map(l => {
        if (l.postParams) {
          return post(l.link, l.postParams);
        } else {
          return get(l.link);
        }
      });
      let res = [];

      let items = (await Promise.all(promiseArray.map(p => p.catch(e => e)))).flatMap(x => x);

      for (let i = 0; i < items.length; i++) {
        if (items[i]) {
          res.push({
            key: links[i].key,
            value: items[i],
            big_map: links[i].big_map
          });
        }
      }

      return res;
    },
    getReversedTxHashes(groups) {
      let res = [];

      Object.keys(groups).forEach(function(hash) {
        if (["transaction", "origination"].includes(groups[hash].operations[0].kind)) {
          res.push(hash);
        }
      });

      return res.reverse();
    },
    async getOldStorage(groups) {
      let hashes = this.getReversedTxHashes(groups);
      let firstHash = hashes[0];
      let prevBlock = groups[firstHash]["level"] - 1;

      let currentStorageRaw = undefined;
      let currentStorageSize = "0";
      if (groups[firstHash]["operations"][0]["kind"] != "origination") {
        let stResponse = await get(
          `${this.baseNodeApiURL}/${prevBlock}/context/contracts/${this.address}`
        );
        if (stResponse.script !== undefined) {
          currentStorageRaw = stResponse.script.storage;
        }
      }

      groups[firstHash]["operations"][0]["prevStorage"] = decodeData(
        currentStorageRaw, this.getStorageSchema(groups[firstHash]["level"]));

      for (let i = 0; i < hashes.length; i++) {
        let group = groups[hashes[i]];
        for (var tx of group["operations"]) {
          tx.rawPrevStorage = currentStorageRaw;
          if (tx.status === "applied" && tx.destination === this.address) {
            if (tx.rawStorage) {

              if (tx.bigMapDiff) {
                tx.rawStorage = this.mergeBigMapToStorage(tx.rawStorage, tx.bigMapDiff);

                if (tx.rawPrevStorage) {
                  tx.rawPrevBigMap = await this.getBigMapPrev(tx.bigMapDiff, group["level"] - 1);
                  tx.rawPrevStorage = this.mergeBigMapToStorage(tx.rawPrevStorage, tx.rawPrevBigMap);
                }
              }

              currentStorageRaw = tx.rawStorage;
              currentStorageSize = tx.storageSize;
            }

            tx.storage = decodeData(tx.rawStorage, this.getStorageSchema(group['level']));
          }
          
          tx.prevStorage = decodeData(tx.rawPrevStorage, this.getStorageSchema(group['level'] - 1));
        }

        if (group.storageSize === undefined) {
          group.storageSize = currentStorageSize;
        }
      }

      return groups;
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
          if (op.result !== undefined) {
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
              if (op.kind === "origination") {
                if (op.script !== undefined) {
                  op.rawStorage = op.script.storage;
                }
              } else {
                op.rawStorage = op.metadata.operation_result.storage;
              }
              op.bigMapDiff = op.metadata.operation_result.big_map_diff;
              op.storageSize = op.metadata.operation_result.storage_size;
            }
          }

          if (op.destination === this.address) {
            groups[hash].storageSize = op.storageSize;
            if (op.parameters !== undefined) {
              if (op.errors.length > 0 && op.errors[0].id.endsWith("badContractParameter")) {
                op.decodedParameters = decodeParameters(op.parameters, null);
              } else {
                op.decodedParameters = decodeParameters(
                  op.parameters, this.getParameterSchema(groups[hash]['level']));
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
    findBigMapPath(rawStorage, bigMapId) {
      let binPath = "00";
      let walk = function(x, path) {
        if (x.args) {
          for (var i = 0; i < x.args.length; i++) {
            if (x.args[i].int == bigMapId) {
              binPath = path;
            } else {
              walk(x.args[i], path + i.toString());
            }
          }
        }
      }
      return binPath;
    },
    getBigMapNode(rawStorage, binPath) {
      let node = rawStorage;
      for (var i = 1; i < binPath.length - 1; i++) {
        node = node.args[parseInt(i)];
      }
      const lastIndex = parseInt(binPath[binPath.length - 1]);
      if (typeof(node.args[lastIndex]) != "array") {
         node.args[lastIndex] = [];
      }
      return node.args[lastIndex];
    },
    mergeBigMapToStorage(rawStorage, bigMapDiff) {
      let current = JSON.parse(JSON.stringify(rawStorage));
      bigMapDiff.forEach(change => {
        if (change.value === undefined || change.action === "alloc") {
          return;
        }
        let path = "00";
        if (change.big_map !== undefined) {
          path = this.findBigMapPath(rawStorage, change.big_map);
        }
        
        let node = this.getBigMapNode(current, path);
        node.push({
          prim: "Elt",
          args: [change.key, change.value]
        })
      });
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
    async getSandboxData() {
      let groups = {};
      const txsPerPage = 10;

      while (
        (this.txInfo.currentPage > 2 || this.txInfo.currentPage === 0) &&
        Object.keys(groups).length < txsPerPage
      ) {
        let blockId = this.txInfo.currentPage == 0 ? "head" : this.txInfo.currentPage - 1;
        let block = await this.getEntireBlock(blockId);
        this.tezaurus[block.header.level] = block.header.timestamp;

        let blockGroups = this.pushOperationsToGroups(block.operations[3], block.header.level);
        if (Object.keys(blockGroups).length > 0) {
          groups = Object.assign({}, groups, blockGroups);
        }

        if (this.txInfo.currentPage == 0) {
          this.txInfo.currentPage = block.header.level;
        } else if (this.txInfo.currentPage > 2) {
          this.txInfo.currentPage--;
          this.morePages = true;
        } else {
          this.morePages = false;
        }
      }

      return groups;
    },
    async getEntireBlock(block_id) {
      return await get(`${this.baseNodeApiURL}/${block_id}`);
    },
    async getBlockData(address) {
      const cnsl = setupConseil(this.tezosNet);

      let txQuery = ConseilQueryBuilder.blankQuery();
      txQuery = ConseilQueryBuilder.addFields(txQuery, "block_level", "timestamp");
      txQuery = ConseilQueryBuilder.addPredicate(
        txQuery,
        "destination",
        ConseilOperator.EQ,
        [address],
        false
      );
      txQuery = ConseilQueryBuilder.addOrdering(txQuery, "block_level", ConseilSortDirection.DESC);
      txQuery = ConseilQueryBuilder.setLimit(txQuery, 999999);

      let origQuery = ConseilQueryBuilder.blankQuery();
      origQuery = ConseilQueryBuilder.addFields(origQuery, "block_level", "timestamp", "source");
      origQuery = ConseilQueryBuilder.addPredicate(
        origQuery,
        "originated_contracts",
        ConseilOperator.EQ,
        [address],
        false
      );
      origQuery = ConseilQueryBuilder.addOrdering(
        origQuery,
        "block_level",
        ConseilSortDirection.DESC
      );
      origQuery = ConseilQueryBuilder.setLimit(origQuery, 999999);

      const txResult = await ConseilDataClient.executeEntityQuery(
        cnsl.server,
        cnsl.platform,
        cnsl.network,
        cnsl.entity,
        txQuery
      );
      const origResult = await ConseilDataClient.executeEntityQuery(
        cnsl.server,
        cnsl.platform,
        cnsl.network,
        cnsl.entity,
        origQuery
      );
      const transactions = txResult.concat(origResult).sort((a, b) => {
        return b["timestamp"] - a["timestamp"];
      });

      if (origResult.length !== 0 && origResult[0].source !== undefined) {
        return { txs: transactions, manager: origResult[0].source };
      }

      return { txs: [], manager: "" };
    },
    checkPayoutSignature(code) {
      const signature = utils.payoutSignature();
      let res = code.find(x => x.prim === "code");

      return signature === JSON.stringify(res);
    },
    async getConseilTransactionData() {
      if (this.txInfo.currentPage == 0) {
        let res = await this.getBlockData(this.address);
        this.blockData = res.txs;
        this.contractManager = res.manager;
      }

      const txsPerPage = 10;
      const offset = this.txInfo.currentPage * txsPerPage;
      let res = this.blockData.slice(offset, Math.min(offset + txsPerPage, this.blockData.length));

      this.txInfo.currentPage += 1;
      this.txInfo.morePages = offset + txsPerPage < this.blockData.length;

      return res;
    },
    async getTransactionData() {
      const res = await get(
        `${this.baseApiURL}/operations/${this.address}?type=Transaction&number=10&p=${this.txInfo.currentPage}`
      );

      this.txInfo.morePages = res.length === 10;
      this.txInfo.currentPage += 1;

      return res;
    },
    async getTzStatsTransactionData() {
      if (this.txInfo.currentPage == 0) {
        const res = await get(
          `${this.tzStatsUrl()}/tables/op?receiver=${this.address}&columns=height,time,type,manager,sender&order=desc&limit=50000`
        )
        this.blockData = res;
        if (res.length > 0) {
          const op = res[res.length - 1];
          if (op[2] === 'origination') {
            this.contractManager = op[3] || op[4];
          } else {
            console.log("Origination is missing, perhaps TF contract")
          }
        }
      }

      const txsPerPage = 10;
      const offset = this.txInfo.currentPage * txsPerPage;
      let res = this.blockData.slice(offset, Math.min(offset + txsPerPage, this.blockData.length));

      this.txInfo.currentPage += 1;
      this.txInfo.morePages = offset + txsPerPage < this.blockData.length;

      return res;
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
