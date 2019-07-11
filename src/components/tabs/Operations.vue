<template>
  <div class="tab-wrapper">
    <b-row class="styled-row" v-for="(group, hash) in groups" :key="group.level">
      <b-col lg="12" class="pt-3 info-wrapper">
        <GroupInfo
          :group="group"
          :hash="hash"
          :balance="group.balance"
          :storageSize="group.storageSize"
        />
      </b-col>
      <b-col lg="12" class="mb-3 pt-3 pl-4">
        <b-row v-for="tx in group['operations']" :key="tx.hash">
          <TxInfo
            :tx="tx"
            :gasLimit="group.gasLimit"
            :address="address"
            :tezosNet="tezosNet"
            :storageLimit="group.storageLimit"
            @expand="expand(tx)"
          />
        </b-row>
      </b-col>
    </b-row>
    <b-row v-if="morePages" class="styled-row">
      <b-col lg="12" class="text-center mb-3 mt-3">
        <button type="button" class="btn btn-link" @click="loadMore">Load More</button>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import GroupInfo from "@/components/GroupInfo.vue";
import TxInfo from "@/components/TxInfo.vue";

export default {
  name: "Operations",
  props: ["groups", "address", "tezosNet", "morePages"],
  components: {
    GroupInfo,
    TxInfo
  },
  methods: {
    loadMore() {
      this.$emit("loadmore");
    },
    expand(tx) {
      tx.expand = !tx.expand;
    }
  }
};
</script>

<style scoped>
.tab-pane {
  outline: none;
}

.tabs .card-header {
  padding: 0rem 1.25rem;
}

.tab-wrapper {
  background-color: #fafafa;
  padding-top: 20px;
  padding-left: 40px;
  padding-right: 40px;
  margin: 0;
}

.styled-row {
  margin-bottom: 15px;
  background-color: #fff;
  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 1px 5px 0 rgba(0, 0, 0, 0.12);
}

.info-wrapper {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background-color: rgba(220, 237, 200, 0.6);
}

.schema-title {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  font-size: 14px;
}
</style>

<style>
.card,
.alert,
.badge {
  border-radius: 0;
}

.card-header {
  background-color: transparent;
  padding-top: 20px;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.nav-pills .nav-link.active,
.nav-pills .show > .nav-link {
  color: #fff;
  background-color: rgba(0, 0, 0, 0.54);
}

.nav-pills {
  padding: 20px 10px 10px 10px;
  min-height: calc(100vh - (56px)) !important;
  width: 61px;
}

.nav-pills a {
  color: rgba(0, 0, 0, 0.54);
  text-align: center;
  padding: 7px 10px 7px 10px;
}

.nav-pills .nav-link {
  border-radius: 50%;
  margin-bottom: 20px;
}

.my-title {
  font-size: 12px;
  color: #76a34e;
  text-transform: uppercase;
}

.my-subtitle {
  font-size: 10px;
  color: rgba(100, 100, 100, 0.8);
  text-transform: uppercase;
}

.tx-hash {
  font-size: 12px;
  font-family: "Roboto Mono", monospace;
  font-weight: 300;
}

mark {
  padding: 0;
  background-color: transparent;
  color: #e83e8c;
}

.storage-tree-view {
  margin-left: -18px;
  white-space: pre;
  font-size: 14px;
  font-family: "Roboto Mono", monospace;
}

.loadMore-link {
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: #007bff;
  text-decoration: none;
  background-color: transparent;
  font-weight: 300;
}

.loadMore-link:hover {
  text-decoration: underline;
}
</style>
