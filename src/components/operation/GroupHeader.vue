<template>
  <b-row class="info-block">
    <b-col class="pl-0 pr-0">
      <span class="mr-3">{{ opDate }}, {{ opTime }}</span>
      <span v-b-tooltip.hover title="Block Level">
        <font-awesome-icon icon="cube"/>
        &nbsp;{{ blockLevel }}
      </span>
    </b-col>
    

    <b-col class="pl-0">
      <span class="hash-address" v-b-tooltip.hover title="Operation Hash">{{ hash }}</span>
    </b-col>

    <b-col class="pl-0 text-right">
      <span v-b-tooltip.hover title="Total Fee" class="mr-3">
        <font-awesome-icon icon="receipt"/>
        &nbsp;{{ formatXTZ(fee) }}
      </span>

      <span v-b-tooltip.hover title="Total Gas Limit" class="mr-3">
        <font-awesome-icon icon="burn"/>
        &nbsp;{{ gasLimit }}
      </span>

      <span v-b-tooltip.hover title="Total Storage Limit">
        <font-awesome-icon icon="coins"/>
        &nbsp;{{ storageLimit }}
      </span>
    </b-col>
  </b-row>
</template>

<script>
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCube } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import utils from "@/app/utils";

library.add(faCube);

export default {
  name: "GroupHeader",
  props: [
    "opDate",
    "opTime",
    "blockLevel",
    "hash",
    "fee",
    "gasLimit",
    "storageLimit"
  ],
  components: {
    FontAwesomeIcon
  },
  methods: {
    formatXTZ(amount) {
      return utils.formatXTZ(amount);
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
