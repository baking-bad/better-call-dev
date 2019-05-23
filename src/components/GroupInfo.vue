<template>
  <div class="info-block">
    <code>{{ formatAddress(hash) }}</code>
    <div>{{ group.date }}, {{ group.time }}</div>
    <br>
    <div align-h="start">
      <div>
        <font-awesome-icon icon="cube"/>
        {{ group.level }}
      </div>
      <div>
        <font-awesome-icon icon="receipt"/>
        {{ formatXTZ(group.fee) }}
      </div>
      <div>
        <font-awesome-icon icon="burn"/>
        {{ group.gasLimit }}
      </div>
      <div>
        <font-awesome-icon icon="database"/>
        {{ group.storageLimit }}
      </div>
    </div>
  </div>
</template>

<script>
import utils from "@/app/utils";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCube, faBurn, faDatabase, faReceipt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faCube, faBurn, faDatabase, faReceipt);

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
.info-block {
  font-size: 80%;
  display: flex;
  flex-direction: column;
  align-items: left;
  margin-bottom: 15px;
}

code {
  color: rgb(42, 42, 42);
}
</style>
