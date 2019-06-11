<template>
  <div class="info-block">
    <span class="mr-4">{{ group.date }}, {{ group.time }}</span>
    <code class="hash-address mr-5" v-b-tooltip.hover title="Block Hash">{{ hash }}</code>

    <span v-b-tooltip.hover title="Block" class="mr-2">
      <font-awesome-icon icon="cube"/>
      {{ group.level }}
    </span>

    <span v-b-tooltip.hover title="Fee" class="mr-2">
      <font-awesome-icon icon="receipt"/>
      {{ formatXTZ(group.fee) }}
    </span>

    <span v-b-tooltip.hover title="Gas Limit" class="mr-2">
      <font-awesome-icon icon="burn"/>
      {{ group.gasLimit }}
    </span>

    <span v-b-tooltip.hover title="Storage Limit" class="mr-5">
      <font-awesome-icon icon="coins"/>
      {{ group.storageLimit }}
    </span>

    <span v-b-tooltip.hover title="Resulting Balance" class="mr-2">
      <font-awesome-icon icon="cash-register"/>
      {{ formatXTZ(balance, 0) }}
    </span>

    <span class="add-info mr-2" v-if="storageSize" v-b-tooltip.hover title="Storage Size">
      <font-awesome-icon icon="database"/>
      {{ storageSize }} ({{storagePercent(storageSize)}})
    </span>
  </div>
</template>

<script>
import utils from "@/app/utils";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCube,
  faBurn,
  faReceipt,
  faCoins,
  faCashRegister,
  faDatabase
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faCube, faBurn, faReceipt, faCoins, faCashRegister, faDatabase);

export default {
  name: "GroupInfo",
  components: {
    FontAwesomeIcon
  },
  props: {
    group: Object,
    hash: String,
    balance: Number,
    storageSize: String
  },
  methods: {
    formatAddress(address) {
      return utils.formatAddress(address);
    },
    formatXTZ(amount, decimals) {
      return utils.formatXTZ(amount, decimals);
    },
    storagePercent(size) {
      let currentStorageSize = parseInt(size);

      return Math.round((currentStorageSize / 60000) * 100) + "%";
    }
  }
};
</script>

<style scoped>
.hash-address {
  font-size: 12px;
}
.info-block {
  font-size: 75%;
  margin-top: 5px;
  margin-bottom: 20px;
  margin-left: 10px;
}

code {
  color: rgb(42, 42, 42);
}
</style>
