<template>
  <b-col lg="12">
    <div class="my-title" :class="entrypoint(tx) ? 'call' : tx.kind">
      <span v-if="tx.internal">internal&nbsp;</span>
      <span v-if="tx.reward && tx.kind === 'transaction'">Reward Payment</span>
      <span v-else-if="entrypoint(tx)">CALL {{entrypoint(tx)}}</span>
      <span v-else>{{tx.kind}}</span>
      <span :class="'ml-1 badge badge-outline ' + badgeClass(tx.status)">{{ tx.status }}</span>
    </div>

    <b-row class="mt-2">
      <b-col lg="12">
        <div class="mb-2" style="display: flex;">
          <div class="mr-4">
            <div class="my-subtitle">Source</div>
            <span class="tx-hash">
              <mark v-if="address == tx.source">{{ tx.source }}</mark>
              <a
                v-else-if="tx.source[0] == 'K'"
                target="_blank"
                :href="baseAppURL + tezosNet + '/' + tx.source"
              >{{ tx.source }}</a>
              <span v-else style="white-space: pre;">{{ formatAddress(tx.source) }}</span>
            </span>
          </div>
          <div class="mr-4">
            <div class="my-subtitle" v-if="tx.destination">
              <span v-if="tx.kind == 'transaction'">Destination</span>
              <span v-if="tx.kind == 'origination'">New Contract</span>
              <span v-if="tx.kind == 'delegation'">Delegate</span>
            </div>
            <span class="tx-hash" v-if="tx.destination">
              <mark v-if="address == tx.destination">{{ tx.destination }}</mark>
              <a
                v-else-if="tx.destination[0] == 'K'"
                target="_blank"
                :href="baseAppURL + tezosNet + '/' + tx.destination"
              >{{ tx.destination }}</a>
              <span v-else style="white-space: pre;">{{ formatAddress(tx.destination) }}</span>
            </span>
          </div>
          <div class="mr-4" style="min-width: 90px;">
            <div class="my-subtitle" v-if="tx.amount">Amount</div>
            <span style="font-size: 75%;" v-if="tx.amount">
              <font-awesome-icon icon="receipt" :style="{ color: '#c0b294' }" />
              {{ formatXTZ(tx.amount) }}
            </span>
          </div>
          <div class="mr-4" style="min-width: 90px;">
            <div class="my-subtitle">Consumed Gas</div>
            <span style="font-size: 75%;">
              <font-awesome-icon icon="burn" :style="{ color: '#007ac2' }" />
              &nbsp;{{ tx.consumedGas }}&nbsp;
              <span
                v-if="tx.consumedGas"
              >({{spentPercent(tx.consumedGas, gasLimit)}})</span>
            </span>
          </div>
          <div class="mr-4" v-if="!tx.reward">
            <div class="my-subtitle">Paid Storage Diff</div>
            <span style="font-size: 75%;">
              <font-awesome-icon icon="coins" />
              &nbsp;{{ tx.paidStorageDiff }}&nbsp;
              <span
                v-if="tx.paidStorageDiff"
              >({{spentPercent(tx.paidStorageDiff, storageLimit)}})</span>
            </span>
          </div>
          <div class="mr-4" v-if="!tx.internal">
            <div class="my-subtitle">Counter</div>
            <span style="font-size: 75%;">
              <font-awesome-icon icon="angle-double-up" />
              &nbsp;{{ tx.counter }}
            </span>
          </div>
          <div v-if="address == tx.destination && !tx.reward">
            <div class="my-subtitle">Parameter / Storage</div>
            <span>
              <button class="my-button" @click="expand(tx)">
                <span v-if="tx.expand">hide</span>
                <span v-else>show</span>
              </button>
            </span>
          </div>
          <div v-if="tx.reward">
            <div class="my-subtitle">Audit</div>
            <span style="font-size: 80%;">
              <a :href="'https://baking-bad.org/'+tx.destination" target="_blank">Baking Bad</a>
              &nbsp;<span style="font-size: 80%;"><font-awesome-icon icon="external-link-alt"></font-awesome-icon></span>
            </span>
          </div>
        </div>
      </b-col>
      <b-col lg="12" class="mb-2" v-if="tx.expand && address == tx.destination && !tx.reward">
        <b-card>
          <b-row>
            <b-col lg="5">
              <div v-if="tx.decodedParameters != null">
                <div class="my-subtitle">Parameter</div>
                <div class="tx-info-tree-view">
                  <TreeView :data="tx.decodedParameters" max-length="64" max-depth="5" />
                </div>
              </div>
              <div v-if="tx.kind == 'origination' && tx.destination == address">
                <div class="my-subtitle">Code</div>
                <router-link to="script">
                  <span style="font-size: 80%;">view</span>
                </router-link>
              </div>
            </b-col>
            <b-col lg="7">
              <div>
                <div class="my-subtitle">Storage</div>
                <div class="tx-info-tree-view">
                  <div v-if="tx.status === 'applied' && tx.storage !== undefined">
                    <PatchView :prev-data="tx.prevStorage" :data="tx.storage" :max-depth="storageDepth(tx)" />
                  </div>
                  <div v-if="tx.status !== 'applied' && tx.prevStorage">
                    <PatchView :prev-data="tx.prevStorage" :data="tx.prevStorage" :max-depth="7" />
                  </div>
                </div>
              </div>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
    <b-row class="mt-2" v-if="tx.status === 'failed'">
      <b-col lg="6">
        <div v-for="error in tx.errors" :key="error.id">
          <b-alert class="mr-2" variant="danger" show style="font-size: 75%;">
            <b>{{ errorTitle(error.id) }}</b>
            <br />
            {{ errorDescription(error.id) }}
            <br />
            <i v-if="error.msg">{{error.msg}}</i>
          </b-alert>
        </div>
      </b-col>
    </b-row>
    <br />
  </b-col>
</template>

<script>
import utils from "@/app/utils";
import { library } from "@fortawesome/fontawesome-svg-core";
import Errors from "@/app/tezosErrors";
import { faReceipt, faBurn, faCoins, faAngleDoubleUp, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import TreeView from "./TreeView.vue";
import PatchView from "./PatchView.vue";

library.add(faReceipt, faBurn, faCoins, faAngleDoubleUp, faExternalLinkAlt);

export default {
  name: "GroupInfo",
  components: {
    FontAwesomeIcon,
    TreeView,
    PatchView
  },
  props: {
    tx: Object,
    gasLimit: Number,
    address: String,
    tezosNet: String,
    storageLimit: Number
  },
  data: () => ({
    baseAppURL: "https://better-call.dev/",
    Errors
  }),
  methods: {
    spentPercent(current, limit) {
      let percent = Math.round((parseInt(current) / parseInt(limit)) * 100);
      if (percent === 0) {
        return "<1%";
      } else if (percent === 100) {
        if (current < limit) {
          return (parseInt(current) / parseInt(limit) * 100).toFixed(1) + "%";
        } else if (current > limit) {
          return ">100%";
        } else {
          return "100%";
        }
      } else {
        return percent + "%";
      }
    },
    formatAddress(address) {
      return utils.formatAddress(address);
    },
    formatXTZ(amount) {
      return utils.formatXTZ(amount);
    },
    errorTitle(id) {
      let errID = this.formatId(id);
      if (Errors.hasOwnProperty(errID)) {
        return Errors[errID].title;
      }

      return "Error occured:";
    },
    errorDescription(id) {
      let errID = this.formatId(id);
      if (Errors.hasOwnProperty(errID)) {
        return Errors[errID].descr;
      }

      return id;
    },
    formatId(id) {
      return id
        .split(".")
        .slice(2)
        .join(".");
    },
    badgeClass(status) {
      if (status == "failed") {
        return "badge-danger";
      }
      if (status == "skipped") {
        return "badge-warning";
      }
      if (status == "applied") {
        return "badge-success";
      }
      if (status == "backtracked") {
        return "badge-info";
      }

      return "badge-secondary";
    },
    expand() {
      this.$emit("expand");
    },
    entrypoint(operation) {
      const params = operation.decodedParameters;
      if (typeof(params) === "object") {
        let entrypoint = Object.keys(operation.decodedParameters)[0];
        if (entrypoint && entrypoint.includes("_Liq_entry_")) {
          entrypoint = entrypoint.substring(11);
        }
        return entrypoint
      } else {
        return undefined;
      }
    },
    storageDepth(tx) {
      if (tx.kind === "origination" && tx.internal !== true) {
        return 2;
      } else {
        return 7;
      }
    }
  }
};
</script>

<style scoped>
.my-button {
  padding: 0.1rem 0.5rem;
  font-size: 0.7rem;
  line-height: 1.5;
  border-radius: 0;
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
  display: inline-block;
  font-weight: 400;
  line-height: normal;
  min-width: 50px;
}

.my-button:hover {
  background-color: #5f6569;
  border-color: #5f6569;
}

.my-button:focus {
  outline: none;
}

.tx-hash {
  font-size: 12px;
  font-family: "Roboto Mono", monospace;
  font-weight: 300;
}

.card,
.alert,
.badge {
  border-radius: 0;
}

.my-title {
  font-size: 12px;
  color: #76a34e;
  text-transform: uppercase;
}

.my-title.delegation,
.my-title.origination {
  color: navy;
}

.my-title.call {
  color:darkmagenta;
}

.my-subtitle {
  font-size: 10px;
  color: rgba(100, 100, 100, 0.8);
  text-transform: uppercase;
}

.alert {
  padding: 0.45rem 0.75rem;
}

.add-info {
  font-size: 75%;
  opacity: 0.8;
}

mark {
  padding: 0;
  background-color: transparent;
  color: #e83e8c;
}

code {
  color: rgb(42, 42, 42);
}

.badge-outline {
  line-height: normal;
  font-weight: 400;
  border: 1px solid #999;
  background-color: transparent;
}

.badge-outline.badge-danger {
  color: #dc3545;
  border-color: #dc3545;
}

.badge-outline.badge-warning {
  color: #ffc107;
  border-color: #ffc107;
}

.badge-outline.badge-success {
  color: #28a745;
  border-color: #28a745;
}

.badge-outline.badge-info {
  color: #17a2b8;
  border-color: #17a2b8;
}

.badge-outline.badge-secondary {
  color: #6c757d;
  border-color: #6c757d;
}

.tx-info-tree-view {
  margin-left: -18px;
  font-size: 14px;
}
</style>
