<template>
  <div class="info-block">
    <code class="hash-address">{{ formatAddress(hash) }}</code>
    <div>{{ group.date }}, {{ group.time }}</div>
    <br>
    <div align-h="start">
      <span v-b-tooltip.hover title="Block" placement="topleft">
        <font-awesome-icon icon="cube"/>
        {{ group.level }}
      </span>
      <br>
      <span v-b-tooltip.hover title="Fee">
        <font-awesome-icon icon="receipt"/>
        {{ formatXTZ(group.fee) }}
      </span>
      <br>
      <span v-b-tooltip.hover title="Gas Limit">
        <font-awesome-icon icon="burn"/>
        {{ group.gasLimit }}
      </span>
      <br>
      <span v-b-tooltip.hover title="Storage Limit">
        <font-awesome-icon icon="coins"/>
        {{ group.storageLimit }}
      </span>
    </div>
  </div>
</template>

<script>
import utils from "@/app/utils";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCube, faBurn, faReceipt, faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faCube, faBurn, faReceipt, faCoins);

export default {
  name: "GroupInfo",
  components: {
    FontAwesomeIcon
  },
  props: {
    group: Object,
    hash: String
  },
  methods: {
    formatAddress(address) {
      return utils.formatAddress(address);
    },
    formatXTZ(amount) {
      return utils.formatXTZ(amount);
    }
  }
};
</script>

<style scoped>
.hash-address {
  font-size: 14px;
}
.info-block {
  font-size: 75%;
  display: flex;
  flex-direction: column;
  align-items: left;
  margin-bottom: 15px;
  margin-left: 10px;
}

code {
  color: rgb(42, 42, 42);
}
</style>
