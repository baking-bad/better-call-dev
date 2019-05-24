<template>
  <b-col lg="12">
    <code>
      <mark v-if="address == tx.source">{{ formatAddress(tx.source) }}</mark>
      <a
        v-else-if="tx.source[0] == 'K'"
        target="_blank"
        :href="baseAppURL + tezosNet + ':' + tx.source"
      >{{ formatAddress(tx.source) }}</a>
      <span v-else>{{ formatAddress(tx.source) }}</span>
    </code>

    <span style="font-family: Arial">&nbsp;&nbsp;⟶&nbsp;&nbsp;</span>

    <code>
      <mark v-if="address == tx.destination">{{ formatAddress(tx.destination) }}</mark>
      <a
        v-else-if="tx.destination[0] == 'K'"
        target="_blank"
        :href="baseAppURL + tezosNet + ':' + tx.destination"
      >{{ formatAddress(tx.destination) }}</a>
      <span v-else>{{ formatAddress(tx.destination) }}</span>
    </code>
    &nbsp;
    <span
      v-if="tx.status"
      :class="'badge badge-outline ' + badgeClass(tx.status)"
    >{{ tx.status }}</span>
    &nbsp;&nbsp;
    <span class="add-info" v-if="tx.amount != 0">
      <font-awesome-icon icon="receipt"/>
      {{ formatXTZ(tx.amount) }}
    </span>
    <span class="add-info" v-if="tx.consumedGas">
      <font-awesome-icon icon="burn"/>
      {{ tx.consumedGas }} ({{spentPercent(tx.consumedGas)}})
    </span>
    <span class="add-info" v-if="tx.paidStorageDiff">
      <font-awesome-icon icon="database"/>
      {{ tx.paidStorageDiff }}
    </span>
    <br>
    <div style="font-size: 75%;" v-if="tx.decodedParameters != null">
      parameters
      <br>
      <JsonView :data="tx.decodedParameters"/>
    </div>
    <br>
  </b-col>
</template>

<script>
import utils from "@/app/utils";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faReceipt, faBurn, faDatabase } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import JsonView from "./JsonView.vue";

library.add(faReceipt, faBurn, faDatabase);

export default {
  name: "GroupInfo",
  components: {
    FontAwesomeIcon,
    JsonView
  },
  props: {
    tx: Object,
    gasLimit: String,
    address: String,
    tezosNet: String
  },
  data: () => ({
    baseAppURL: "https://baking-bad.github.io/better-call-dev/#"
  }),
  methods: {
    spentPercent(gas) {
      let gasLimit = parseInt(this.gasLimit);
      let currentGas = parseInt(gas);

      return Math.round((currentGas / gasLimit) * 100) + "%";
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
    }
  }
};
</script>

<style scoped>
.add-info {
  font-size: 75%;
}

mark {
  padding: 0;
}

code {
  color: rgb(42, 42, 42);
}

.badge-outline {
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
