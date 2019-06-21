<template>
  <div class="info-block">
    <span class="mr-1">{{ group.date }}, {{ group.time }}</span>
    <span class="mr-5">at level {{ group.level }}</span>


    <span class="hash-address mr-5" v-b-tooltip.hover title="Operation Hash">{{ hash }}</span>

    <span v-b-tooltip.hover title="Fee" class="mr-3">
      <font-awesome-icon icon="receipt"/>
      {{ formatXTZ(group.fee) }}
    </span>

    <span v-b-tooltip.hover title="Gas Limit" class="mr-3">
      <font-awesome-icon icon="burn"/>
      {{ group.gasLimit }}
    </span>

    <span v-b-tooltip.hover title="Storage Limit" class="mr-5">
      <font-awesome-icon icon="coins"/>
      {{ group.storageLimit }}
    </span>

    <span class="add-info float-right" v-if="storageSize" v-b-tooltip.hover title="Resulting Storage Size">
      <font-awesome-icon icon="database"/>
      {{ storageSize }} ({{storagePercent(storageSize)}})
    </span>

    <span v-b-tooltip.hover title="Resulting Balance" class="float-right mr-3">
      <font-awesome-icon icon="cash-register"/>
      {{ formatXTZ(balance, 0) }}
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
  font-family: "Roboto Mono";
}
.info-block {
  font-size: 80%;
  margin-bottom: 15px;
  margin-left: 10px;
  font-family: "Roboto";
}

.info-block .svg-inline--fa {
  font-size: 80%;
  color: #777;
}

</style>
