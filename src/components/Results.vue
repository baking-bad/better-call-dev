<template>
  <b-col class="pl-0 pr-0" v-if="status">
    <div class="tab-menu pl-4 pt-3">
      <router-link
        tag="button"
        to="operations"
        class="btn btn-outline-success btn-sm mr-2"
      >Operations</router-link>
      <router-link tag="button" to="script" class="btn btn-outline-success btn-sm mr-2">Script</router-link>
      <router-link tag="button" to="state" class="btn btn-outline-success btn-sm">State</router-link>
    </div>

    <router-view v-bind="myProps" @loadmore="loadMore" />
  </b-col>
</template>

<script>
import utils from "@/app/utils";

export default {
  name: "Results",
  props: [
    "manager",
    "script",
    "address",
    "tezosNet",
    "status",
    "groups",
    "morePages",
    "decodedData",
    "decodedSchema",
    "parameterSchema",
    "latestGroup"
  ],
  methods: {
    loadMore() {
      this.$emit("loadmore");
    },
    expand(tx) {
      tx.expand = !tx.expand;
    },
    formatXTZ(amount) {
      return utils.formatXTZ(amount);
    }
  },
  computed: {
    myProps() {
      if (this.$route.name === "script") {
        return {
          address: this.address,
          manager: this.manager,
          script: this.script,
          parameterSchema: this.parameterSchema,
          decodedSchema: this.decodedSchema
        };
      }
      if (this.$route.name === "state") {
        return {
          latestGroup: this.latestGroup,
          decodedData: this.decodedData,
          morePages: this.morePages
        };
      }
      return {
        groups: this.groups,
        address: this.address,
        tezosNet: this.tezosNet,
        morePages: this.morePages
      };
    }
  }
};
</script>

<style scoped>
.tab-menu {
  background-color: #fafafa;
}

.router-link-active {
  background-color: #76a34e;
  border-color: #649b34;
  color: #fff;
}
</style>
