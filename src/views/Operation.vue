<template>
  <div id="app">
    <b-container fluid>
      <Loader :status="isLoading" />
      <b-row>
        <NavBar :address="hash" :tezosNet="tezosNet" />
      </b-row>
      <b-row v-if="!isLoading">
        <div class="tab-wrapper">
          <b-row class="styled-row">
            <b-col lg="12" class="pt-3 info-wrapper">
              <GroupHeader
                :opDate="opDate"
                :opTime="opTime"
                :blockLevel="blockLevel"
                :hash="hash"
              />
            </b-col>
            <b-col lg="12" class="mb-3 pt-3 pl-4">
              <b-row v-for="(op, id) in contents" :key="id + '-' + op.kind + '-' + op.source">
                <OperationInfo
                  :op="op" :tezosNet="tezosNet"
                />
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

import axios from "axios";
import { ConseilQueryBuilder, ConseilOperator, ConseilDataClient } from "conseiljs";
import { setupConseil } from "@/app/conseil";

export default {
  name: "Operation",
  components: {
    GroupHeader,
    OperationInfo,
    Loader,
    NavBar
  },
  data: () => ({
    isLoading: false,
    tezosNet: "alpha",
    hash: "",
    blockLevel: 0,
    timestamp: 0,
    contents: []
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
      this.isLoading = false;
      this.blockLevel = 0;
      this.timestamp = 0;
      this.contents = [];
    },
    async explore() {
      await this.initApp();

      this.isLoading = true;

      let opData = await this.getOperationData(this.tezosNet, this.hash);
      this.blockLevel = opData.level;
      this.timestamp = opData.ts;

      let operations = await this.getOperations(opData.level);
      let rawContents = operations.find(op => op.hash === this.hash).contents;
      let contentsWithInternal = this.getInternalContents(rawContents);

      this.contents = this.restructureContents(contentsWithInternal); 
      this.isLoading = false;
    },
    async getOperations(block) {
      let res = {};
      await axios
        .get(`${this.baseNodeApiURL}/${block}/operations/3`)
        .then(response => {
          res = response.data;
        })
        .catch(() => {
          res = undefined;
        });
      return res;
    },
    async getOperationData(net, hash) {
      const cnsl = setupConseil(net);

      let txQuery = ConseilQueryBuilder.blankQuery();
      txQuery = ConseilQueryBuilder.addFields(txQuery, 'block_level', 'timestamp');
      txQuery = ConseilQueryBuilder.addPredicate(txQuery, 'operation_group_hash', ConseilOperator.EQ, [hash], false);
      txQuery = ConseilQueryBuilder.setLimit(txQuery, 1);

      const txResult = await ConseilDataClient.executeEntityQuery(cnsl.server, cnsl.platform, cnsl.network, cnsl.entity, txQuery);

      return {
        level: txResult[0].block_level,
        ts: txResult[0].timestamp
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
          })
        }
      })

      return res;
    },
    restructureContents(contents) {
      contents.forEach(function(op) {
        if (op.result !== undefined) {
          op.status = op.result.status;
          op.errors = op.result.errors;
          op.consumedGas = op.result.consumed_gas || 0;
          op.paidStorageDiff = op.result.paid_storage_size_diff || 0;

          if (op.kind === "origination") {
            op.destination = op.result.originated_contracts[0];
          } else if (op.kind === "reveal") {
            op.destination = op.public_key;
          }
        } else if (op.metadata.operation_result !== undefined) {
          op.status = op.metadata.operation_result.status;
          op.errors = op.metadata.operation_result.errors;
          op.consumedGas = op.metadata.operation_result.consumed_gas || 0;
          op.paidStorageDiff = op.metadata.operation_result.paid_storage_size_diff || 0;

          if (op.kind === "origination") {
            op.destination = op.metadata.operation_result.originated_contracts[0];
          } else if (op.kind === "reveal") {
            op.destination = op.public_key;
          }
        }
      })
      return contents
    }
  },
  computed: {
    opDate() {
      const dateObj = new Date(this.timestamp);

      return dateObj.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "2-digit"
      })
    },
    opTime() {
      const dateObj = new Date(this.timestamp);

      return dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
      })
    },
    baseNodeApiURL() {
      switch (this.tezosNet) {
        case "main": return "https://rpc.tezrpc.me/chains/main/blocks";
        case "alpha": return "https://tezos-dev.cryptonomic-infra.tech/chains/main/blocks";
        case "sandbox": return "http://127.0.0.1:8732/chains/main/blocks";
        default: throw this.tezosNet;
      }
    }
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