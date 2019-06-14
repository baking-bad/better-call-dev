<template>
  <b-col lg="12" class="pl-0 pr-0" v-if="status">
    <div class="magic-top-divider"></div>
    <div id="tabs">
      <b-tabs pills card vertical>
        <b-tab active class="pl-0 pr-0 pt-0">
          <template slot="title">
            <span v-b-tooltip.hover title="Operations">
              <font-awesome-icon icon="exchange-alt"/>
            </span>
          </template>
          <b-container class="tab-wrapper">
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
          </b-container>
        </b-tab>

        <b-tab title="Storage" class="pl-0 pr-0 pt-0 pb-0">
          <template slot="title">
            <span v-b-tooltip.hover title="Schemas">
              <font-awesome-icon icon="code"/>
            </span>
          </template>
          <b-container class="tab-wrapper">
            <b-row class="schemas">
              <b-col lg="6" class="styled-row mr-3 pl-0 pr-0">
                <div class="schema-title p-3 info-wrapper">storage</div>
                <div class="p-3">
                  <JsonView :data="decodedData"/>
                </div>
              </b-col>
              <b-col lg="5" class="styled-row mr-1 pl-0 pr-0">
                <div class="schema-title p-3 info-wrapper">schema</div>
                <div class="p-3">
                  <JsonView :data="decodedSchema"/>
                </div>
              </b-col>
              <b-col lg="6" class="styled-row pl-0 pr-0">
                <div class="schema-title p-3 info-wrapper">parameter schema</div>
                <div class="p-3">
                  <JsonView :data="parameterSchema"/>
                </div>
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

.nav-pills a {
  color: rgba(0, 0, 0, 0.54);
}

.nav-pills .nav-link {
  border-radius: 0;
}
</style>
