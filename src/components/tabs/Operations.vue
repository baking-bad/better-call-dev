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
</style>

<style>
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

.my-subtitle {
  font-size: 10px;
  color: rgba(100, 100, 100, 0.8);
  text-transform: uppercase;
}
</style>
