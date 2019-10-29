<template>
  <div id="app">
    <b-container fluid>
      <Loader :status="isLoading" />
      <b-row>
        <NavBar :address="hash" :tezosNet="tezosNet" />
      </b-row>
      <b-row v-if="!isLoading">
        <NotFound :status="notFound" :address="''" :tezosNet="tezosNet" />
        <div class="tab-wrapper" v-if="!notFound">
          <b-row class="styled-row">
            <b-col lg="12" class="pt-3 info-wrapper">
              <GroupHeader :opDate="opDate" :opTime="opTime" :blockLevel="blockLevel" :hash="hash" 
                           :fee="fee" :gasLimit="gasLimit" :storageLimit="storageLimit" />
            </b-col>
            <b-col lg="12" class="mb-3 pt-3 pl-4">
              <b-row v-for="(op, id) in contents" :key="id + '-' + op.kind + '-' + op.source">
                <OperationInfo :op="op" :tezosNet="tezosNet" />
              </b-row>
            </b-col>
          </b-row>
        </div>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import GroupHeader from "@/components/operation/GroupHeader.vue";
import OperationInfo from "@/components/operation/OperationInfo.vue";
import Loader from "@/components/Loader.vue";
import NavBar from "@/components/NavBar.vue";
import NotFound from "@/components/NotFound.vue";
import { decodeData } from "@/app/decode";
import { ConseilQueryBuilder, ConseilOperator, ConseilDataClient } from "conseiljs";
import { setupConseil } from "@/app/conseil";
import { get } from "@/app/http";
import lscache from "lscache";
import { NetConfig } from "../netConfig";

export default {
  name: "Operation",
  components: {
    GroupHeader,
    OperationInfo,
    Loader,
    NavBar,
    NotFound
  },
  data: () => ({
    isLoading: false,
    tezosNet: "main",
    hash: "",
    fee: 0,
    gasLimit: 0,
    storageLimit: 0,
    blockLevel: 0,
    timestamp: 0,
    contents: [],
    notFound: false
  }),
  watch: {
    "$route.params": function() {
      let net = this.$router.history.current.params.network;
      let hash = this.$router.history.current.params.hash;

      if (this.tezosNet !== net || this.hash !== hash) {
        this.tezosNet = net;
        this.hash = hash;
        this.explore();
      }
    }
  },
  beforeMount() {
    this.tezosNet = this.$router.history.current.params.network;
    this.hash = this.$router.history.current.params.hash;
    this.explore();
  },
  methods: {
    async initApp() {
      if (!localStorage["WASTED"]) {
        localStorage.clear();
        localStorage["WASTED"] = true;
      }

      lscache.flushExpired();

      this.isLoading = false;
      this.blockLevel = 0;
      this.timestamp = 0;
      this.contents = [];
    },
    async explore() {
      await this.initApp();

      this.isLoading = true;

      let opData = undefined;
      if (this.implementsTzStats) {
        opData = await this.getTzStatsOperationData(this.tezosNet, this.hash);
      } else if (this.implementsConseil) {
        opData = await this.getConseilOperationData(this.tezosNet, this.hash);
      }      
      
      if (opData === undefined) {
        this.isLoading = false;
        this.notFound = true;
      } else {
        this.blockLevel = opData.level;
        this.timestamp = opData.ts;

        let operations = await this.getOperations(opData.level);
        let rawContents = operations.find(op => op.hash === this.hash).contents;
        let contentsWithInternal = this.getInternalContents(rawContents);

        let getInt = function(content, key) {
          if (content !== undefined) {
            const prop = content[key];
            if (prop !== undefined) {
              return parseInt(prop);
            }
          }
          return 0;
        }

        this.contents = this.restructureContents(contentsWithInternal);
        this.fee = rawContents.reduce((a, b) => getInt(a, 'fee') + getInt(b, 'fee'), 0);
        this.gasLimit = rawContents.reduce((a, b) => getInt(a, 'gas_limit') + getInt(b, 'gas_limit') || 0, 0);
        this.storageLimit = rawContents.reduce((a, b) => getInt(a, 'storage_limit') + getInt(b, 'storage_limit') || 0, 0);
        this.isLoading = false;
      }
    },
    async getOperations(block) {
      return await get(`${this.baseNodeApiURL}/${block}/operations/3`);
    },
    async getTzStatsOperationData(net, hash) {
      const res = await get(`${this.tzStatsUrl}/tables/op?hash=${hash}&columns=height,time`)
      if (res.length > 0) {
        return {
          level: res[0][0],
          ts: res[0][1]
        }
      } else {
        return undefined;
      }
    },
    async getConseilOperationData(net, hash) {
      const cnsl = setupConseil(net);

      let txQuery = ConseilQueryBuilder.blankQuery();
      txQuery = ConseilQueryBuilder.addFields(txQuery, "block_level", "timestamp");
      txQuery = ConseilQueryBuilder.addPredicate(
        txQuery,
        "operation_group_hash",
        ConseilOperator.EQ,
        [hash],
        false
      );
      txQuery = ConseilQueryBuilder.setLimit(txQuery, 1);

      const txResult = await ConseilDataClient.executeEntityQuery(
        cnsl.server,
        cnsl.platform,
        cnsl.network,
        cnsl.entity,
        txQuery
      );
      if (txResult.length > 0) {
        return {
          level: txResult[0].block_level,
          ts: txResult[0].timestamp
        };
      } else {
        return undefined;
      }
    },
    getInternalContents(contents) {
      let res = [];

      contents.forEach(function(operation) {
        res.push(operation);

        if (operation.metadata.internal_operation_results !== undefined) {
          operation.metadata.internal_operation_results.forEach(function(op) {
            op.internal = true;
            op.gas_limit = operation.gas_limit;
            op.storage_limit = operation.storage_limit;
            res.push(op);
          });
        }
      });

      return res;
    },
    getUniqueErrors(errors) {
      let ret = [];
      let seenErr = [];

      if (errors !== undefined) {
        errors.forEach(function(err) {
          if (!seenErr.includes(err.id)) {
            let id = err.id;
            let msg = "";
            if (err.with !== undefined) {
              msg = decodeData(err.with, null);
            }
            ret.push({ id: id, msg: msg });
            seenErr.push(id);
          }
        }, this);
      }

      return ret;
    },
    restructureContents(contents) {
      contents.forEach(function(op) {
        if (op.result !== undefined) {
          op.status = op.result.status;
          op.errors = this.getUniqueErrors(op.result.errors);
          op.consumedGas = parseInt(op.result.consumed_gas) || 0;
          op.paidStorageDiff = parseInt(op.result.paid_storage_size_diff) || 0;

          if (op.kind === "origination") {
            op.destination = op.result.originated_contracts[0];
            op.paidStorageDiff += 257;
          } else if (op.kind === "reveal") {
            op.destination = op.public_key;
          }
        } else if (op.metadata.operation_result !== undefined) {
          op.status = op.metadata.operation_result.status;
          op.errors = this.getUniqueErrors(op.metadata.operation_result.errors);
          op.consumedGas = parseInt(op.metadata.operation_result.consumed_gas) || 0;
          op.paidStorageDiff = parseInt(op.metadata.operation_result.paid_storage_size_diff) || 0;

          if (op.kind === "origination") {
            op.destination = op.metadata.operation_result.originated_contracts[0];
            op.paidStorageDiff += 257;
          } else if (op.kind === "reveal") {
            op.destination = op.public_key;
          }
        }
      }, this);
      return contents;
    },
    netConfig() {
      return new NetConfig(this.tezosNet);
    }
  },
  computed: {
    opDate() {
      const dateObj = new Date(this.timestamp);

      return dateObj.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "2-digit"
      });
    },
    opTime() {
      const dateObj = new Date(this.timestamp);

      return dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
      });
    },
    baseNodeApiURL() {
      if (this.$route.query.blockUrl !== undefined) {
        return decodeURI(this.$route.query.blockUrl);
      } else {
        return this.netConfig().blockUrl();
      }
    },
    tzStatsUrl() {
      return this.netConfig().tzStatsUrl();
    },
    implementsConseil() {
      return this.netConfig().implementsConseil();
    },
    implementsTzStats() {
      return this.netConfig().implementsTzStats();
    },
  }
};
</script>

<style scoped>
.tab-wrapper {
  background-color: #fafafa;
  padding-top: 20px;
  padding-left: 40px;
  padding-right: 40px;
  margin: 0;
}

.styled-row {
  margin-bottom: 15px;
  background-color: #fff;
  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 1px 5px 0 rgba(0, 0, 0, 0.12);
}

.info-wrapper {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background-color: rgba(220, 237, 200, 0.6);
}
</style>
