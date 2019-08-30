<template>
  <b-col lg="12">
    <div class="my-title" :class="op.kind">
      <span v-if="op.internal">internal</span>
      {{op.kind}}
      <span
        :class="'ml-1 badge badge-outline ' + badgeClass(op.status)"
      >{{ op.status }}</span>
    </div>

    <b-row class="mt-2">
      <b-col lg="12">
        <div class="mb-2" style="display: flex;">
          <div class="mr-4">
            <div class="my-subtitle">Source</div>
            <span class="tx-hash">
              <span style="white-space: pre;">{{ formatAddress(op.source) }}</span>
            </span>
          </div>
          <div class="mr-4">
            <div class="my-subtitle" v-if="op.destination">
              <span v-if="op.kind == 'transaction'">Destination</span>
              <span v-if="op.kind == 'origination'">New Contract</span>
              <span v-if="op.kind == 'delegation'">Delegate</span>
              <span v-if="op.kind === 'reveal'">Public Key</span>
            </div>
            <span class="tx-hash" v-if="op.destination">
              <a v-if="op.destination[0] == 'K'" :href="baseAppURL + tezosNet + '/' + op.destination">
                <span style="white-space: pre;">{{ formatAddress(op.destination) }}</span>
              </a>
              <span v-else style="white-space: pre;">{{ formatAddress(op.destination) }}</span>
            </span>
          </div>
          <div class="mr-4" style="min-width: 104px;" v-if="op.amount">
            <div class="my-subtitle">Amount</div>
            <span style="font-size: 75%;">
              <font-awesome-icon icon="receipt" :style="{ color: '#c0b294' }" />
              {{ formatXTZ(op.amount) }}
            </span>
          </div>
          <div class="mr-4" style="min-width: 90px;">
            <div class="my-subtitle">Consumed Gas</div>
            <span v-if="op.consumedGas !== null" style="font-size: 75%;" :class="checkOverflow(op.consumedGas, op.gas_limit)">
              <font-awesome-icon icon="burn" :style="{ color: '#007ac2' }" />
              &nbsp;{{ op.consumedGas }}
              <span v-if="op.consumedGas > 0">({{spentPercent(op.consumedGas, op.gas_limit)}})</span>
            </span>
          </div>
          <div class="mr-4">
            <div class="my-subtitle">Paid Storage Diff</div>
            <span style="font-size: 75%;" :class="checkOverflow(op.paidStorageDiff, op.storage_limit)">
              <font-awesome-icon icon="coins" />
              &nbsp;{{ op.paidStorageDiff }}
              <span v-if="op.paidStorageDiff > 0">({{spentPercent(op.paidStorageDiff, op.storage_limit)}})</span>
            </span>
          </div>
          <div class="mr-4" style="min-width: 90px;">
            <div class="my-subtitle" v-if="op.fee">Fee</div>
            <span style="font-size: 75%;" v-if="op.fee">
              <font-awesome-icon icon="receipt" :style="{ color: '#c0b294' }" />
              {{ formatXTZ(op.fee) }}
            </span>
          </div>
        </div>
      </b-col>
    </b-row>
    <b-row class="mt-2" v-if="op.status === 'failed' || op.status === 'backtracked'">
      <b-col lg="6">
        <div v-for="error in op.errors" :key="error.id">
          <b-alert class="mr-2" variant="danger" show style="font-size: 75%;">
            <b>{{ Errors[error.id].title }}</b>
            <br />
            {{ Errors[error.id].descr }}
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
import Errors from "@/app/tezosErrors";
import utils from "@/app/utils";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faReceipt, faBurn, faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faReceipt, faBurn, faCoins);

export default {
  name: "OperationInfo",
  data: () => ({
    baseAppURL: "https://better-call.dev/",
    Errors
  }),
  components: {
    FontAwesomeIcon
  },
  props: [
    "op", "tezosNet"
  ],
  methods: {
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
    spentPercent(current, limit) {
      let percent = Math.round((current / limit) * 100);
      if (percent === 0) {
        return "<1%";
      } else {
        return percent + "%";
      }
    },
    checkOverflow(value, limit) {
      if (parseInt(value) > parseInt(limit)) {
        return 'overflow-error'
      }
      return ''
    }
  }
};
</script>

<style scoped>
.overflow-error {
  color: red;
}

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
