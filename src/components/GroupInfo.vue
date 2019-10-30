<template>
  <b-row class="info-block">
    <b-col class="pl-0 pr-0">
      <span class="mr-3">{{ group.date }}, {{ group.time }}</span>
      <span v-b-tooltip.hover title="Block height">
        <font-awesome-icon icon="cube"/>
        &nbsp;{{ group.level }}
      </span>
    </b-col>

    <b-col class="pl-0">
      <span class="hash-address" v-b-tooltip.hover title="Operation hash and counter">{{ hash }}&nbsp;/&nbsp;{{ group.counter }}</span>
    </b-col>

    <b-col class="pl-0 text-right">
      <span v-b-tooltip.hover title="Total Fee" class="mr-3">
        <font-awesome-icon icon="receipt"/>
        &nbsp;{{ formatXTZ(group.fee) }}
      </span>

      <span v-b-tooltip.hover title="Total Gas Limit" class="mr-3">
        <font-awesome-icon icon="burn"/>
        &nbsp;{{ group.gasLimit }}
      </span>

      <span v-b-tooltip.hover title="Total Storage Limit">
        <font-awesome-icon icon="coins"/>
        &nbsp;{{ group.storageLimit }}
      </span>
    </b-col>

    <b-col class="pl-0 text-right">
      <span class="mr-3" v-if="storageSize" v-b-tooltip.hover title="Resulting Storage Size">
        <font-awesome-icon icon="database"/>
        {{ storageSize }} ({{storagePercent(storageSize)}})
      </span>

      <span v-b-tooltip.hover title="Resulting Balance">
        <font-awesome-icon icon="cash-register"/>
        {{ formatXTZ(balance, 0) }}
      </span>
    </b-col>
  </b-row>
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
