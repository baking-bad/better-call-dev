<template>
  <b-col lg="12">
    <div class="my-title">
      <span v-if="tx.internal">internal&nbsp;</span>transaction
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
                :href="baseAppURL + tezosNet + ':' + tx.source"
              >{{ tx.source }}</a>
              <span v-else>{{ tx.source }}</span>
            </span>
          </div>
          <div class="mr-4">
            <div class="my-subtitle">Destination</div>
            <span class="tx-hash">
              <mark v-if="address == tx.destination">{{ tx.destination }}</mark>
              <a
                v-else-if="tx.destination[0] == 'K'"
                target="_blank"
                :href="baseAppURL + tezosNet + ':' + tx.destination"
              >{{ tx.destination }}</a>
              <span v-else>{{ tx.destination }}</span>
            </span>
          </div>
          <div class="mr-4" style="min-width: 90px;">
            <div class="my-subtitle">Amount</div>
            <span style="font-size: 75%;">
              <font-awesome-icon icon="receipt" :style="{ color: '#c0b294' }"/>
              {{ formatXTZ(tx.amount) }}
            </span>
          </div>
          <div class="mr-4" style="min-width: 90px;" v-if="tx.consumedGas">
            <div class="my-subtitle">Consumed Gas</div>
            <span style="font-size: 75%;">
              <font-awesome-icon icon="burn" :style="{ color: '#007ac2' }"/>
              {{ tx.consumedGas }} ({{spentPercent(tx.consumedGas)}})
            </span>
          </div>
          <div class="mr-4" v-if="tx.paidStorageDiff">
            <div class="my-subtitle">Paid Storage Diff</div>
            <span style="font-size: 75%;">
              <font-awesome-icon icon="coins"/>
              {{ tx.paidStorageDiff }} ({{paidStoragePercent(tx.paidStorageDiff)}})
            </span>
          </div>
          <div v-if="tx.decodedParameters">
            <div class="my-subtitle">Parameter / Storage</div>
            <span>
              <button class="my-button" @click="expand(tx)">
                <span v-if="tx.expand">hide</span>
                <span v-else>show</span>
              </button>
            </span>
          </div>
        </div>
      </b-col>
      <b-col lg="12" class="mb-2" v-if="tx.expand">
        <b-card>
          <b-row>
            <b-col lg="5">
              <div v-if="tx.decodedParameters != null">
                <div class="my-subtitle">Parameter</div>
                <JsonView :data="tx.decodedParameters"/>
              </div>
            </b-col>
            <b-col lg="7">
              <div v-if="tx.status === 'applied' && tx.storage != null">
                <div class="my-subtitle">Storage</div>
                <PatchView :prev-data="tx.prevStorage" :data="tx.storage" :max-depth="7"/>
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
            <b>{{ Errors[error.id].title }}</b>
            <br>
            {{ Errors[error.id].descr }}
            <br>
            <i v-if="error.msg">{{error.msg}}</i>
          </b-alert>
        </div>
      </b-col>
    </b-row>
    <br>
  </b-col>
</template>

<script>
import utils from "@/app/utils";
import { library } from "@fortawesome/fontawesome-svg-core";
import Errors from "@/app/tezosErrors";
import { faReceipt, faBurn, faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import JsonView from "./JsonView.vue";
import PatchView from "./PatchView.vue";

library.add(faReceipt, faBurn, faCoins);

export default {
  name: "GroupInfo",
  components: {
    FontAwesomeIcon,
    JsonView,
    PatchView
  },
  props: {
    tx: Object,
    gasLimit: String,
    address: String,
    tezosNet: String,
    storageLimit: String
  },
  data: () => ({
    baseAppURL: "https://baking-bad.github.io/better-call-dev/#",
    Errors
  }),
  methods: {
    spentPercent(gas) {
      let gasLimit = parseInt(this.gasLimit);
      let currentGas = parseInt(gas);

      return Math.round((currentGas / gasLimit) * 100) + "%";
    },
    paidStoragePercent(diff) {
      let storageLimit = parseInt(this.storageLimit);
      let paidStorageDiff = parseInt(diff);

      return Math.round((paidStorageDiff / storageLimit) * 100) + "%";
    },
    formatAddress(address) {
      return utils.formatAddress(address);
    },
    formatXTZ(amount) {
      return utils.formatXTZ(amount);
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
    }
  }
};
</script>

<style scoped>
.my-button {
  padding: 0.1rem 0.5rem;
  font-size: 0.7rem;
  line-height: 1.5;
  border-radius: 0.2rem;
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
  display: inline-block;
  font-weight: 400;
  line-height: normal;
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

.my-subtitle {
  font-size: 10px;
  color: rgba(155, 155, 155, 0.8);
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
</style>
