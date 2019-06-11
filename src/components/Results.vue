<template>
  <b-col lg="12" class="pl-0 pr-0" v-if="status">
    <div class="magic-top-divider"></div>
    <div id="tabs">
      <b-tabs pills card vertical>
        <b-tab active class="pl-0 pr-0 pt-0">
          <template slot="title">
            <font-awesome-icon icon="exchange-alt"/>
          </template>
          <b-container class="groups-wrapper">
            <b-row class="styled-row" v-for="(group, hash) in groups" :key="group.level">
              <b-col lg="2" class="pt-3 info-wrapper">
                <GroupInfo
                  :group="group"
                  :hash="hash"
                  :balance="group.balance"
                  :storageSize="group.storageSize"
                />
              </b-col>
              <b-col lg="10" class="mb-3 pt-3">
                <b-row v-for="tx in group['operations']" :key="tx.hash">
                  <TxInfo
                    :tx="tx"
                    :gasLimit="group.gasLimit"
                    :address="address"
                    :tezosNet="tezosNet"
                    :storageLimit="group.storageLimit"
                  />
                </b-row>
              </b-col>
            </b-row>
            <b-row v-if="morePages" class="styled-row">
              <b-col lg="12" class="text-center mb-3 mt-3">
                <button type="button" class="btn btn-link" @click="loadMore">Load More</button>
              </b-col>
            </b-row>
          </b-container>
        </b-tab>

        <b-tab title="Storage" class="pl-0 pr-0">
          <template slot="title">
            <font-awesome-icon icon="code"/>
          </template>
          <b-container>
            <b-row>
              <b-col lg="4">
                <span>storage</span>
                <br>
                <JsonView :data="decodedData"/>
              </b-col>
              <b-col lg="4">
                <span>schema</span>
                <br>
                <JsonView :data="decodedSchema"/>
              </b-col>
              <b-col lg="4">
                <span>schema</span>
                <br>
                <JsonView :data="parameterSchema"/>
              </b-col>
            </b-row>
          </b-container>
        </b-tab>
      </b-tabs>
    </div>
  </b-col>
</template>

<script>
import JsonView from "./JsonView.vue";
import GroupInfo from "./GroupInfo.vue";
import TxInfo from "./TxInfo.vue";

import { library } from "@fortawesome/fontawesome-svg-core";
import { faExchangeAlt, faCode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faExchangeAlt, faCode);

export default {
  name: "Results",
  components: {
    JsonView,
    GroupInfo,
    TxInfo,
    FontAwesomeIcon
  },
  props: [
    "address",
    "tezosNet",
    "status",
    "groups",
    "morePages",
    "decodedData",
    "decodedSchema",
    "parameterSchema"
  ],
  // props: {
  //   address: String,
  //   tezosNet: String,
  //   status: Boolean,
  //   activetab: Number,
  //   groups: Object,
  //   morePages: Boolean,
  //   decodedData: Object,
  //   decodedSchema: Object,
  //   parameterSchema: Object
  // },
  methods: {
    loadMore() {
      this.$emit("loadmore");
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

.groups-wrapper {
  background-color: #fafafa;
  padding-top: 20px;
  padding-left: 40px;
  padding-right: 40px;
}

.styled-row {
  margin-bottom: 15px;
  background-color: #fff;
  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 1px 5px 0 rgba(0, 0, 0, 0.12);
}

.info-wrapper {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}
</style>

<style>
.card-header {
  background-color: none;
  padding-top: 20px;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.nav-pills .nav-link.active,
.nav-pills .show > .nav-link {
  color: #fff;
  background-color: rgba(0, 0, 0, 0.54);
}

.nav-pills a {
  color: rgba(0, 0, 0, 0.54);
}
</style>
