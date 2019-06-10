<template>
  <b-col lg="12" class="mb-3 pl-0 pr-0" v-if="status">
    <div class="magic-top-divider"></div>
    <div id="tabs">
      <b-tabs pills card vertical>
        <b-tab active class="pl-0 pr-0 pt-0">
          <template slot="title">
            <font-awesome-icon icon="exchange-alt"/>
          </template>
          <b-container>
            <b-row class="styled-row" v-for="(group, hash) in groups" :key="group.level">
              <b-col lg="2" class="pt-3 group-wrapper">
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
              <b-col lg="12" class="text-center mb-3">
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
      <!-- <div class="tabs">
        <a @click="tab(1)" :class="[ activetab === 1 ? 'active' : '' ]">Operations</a>
        <a @click="tab(2)" :class="[ activetab === 2 ? 'active' : '' ]">Storage</a>
        <a @click="tab(3)" :class="[ activetab === 3 ? 'active' : '' ]">Parameters</a>
      </div>-->

      <!-- <div class="content">
        <div v-if="activetab === 1" class="tabcontent">
          <b-container>
            <b-row class="styled-row" v-for="(group, hash) in groups" :key="group.level">
              <b-col lg="2">
                <GroupInfo
                  :group="group"
                  :hash="hash"
                  :balance="group.balance"
                  :storageSize="group.storageSize"
                />
              </b-col>
              <b-col lg="10" class="mb-3">
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
              <b-col lg="12" class="text-center mb-3">
                <button type="button" class="btn btn-link" @click="loadMore">Load More</button>
              </b-col>
            </b-row>
          </b-container>
        </div>
        <div v-if="activetab === 2" class="tabcontent storage-tab">
          <b-container>
            <b-row>
              <b-col lg="6">
                <span>storage</span>
                <br>
                <JsonView :data="decodedData"/>
              </b-col>
              <b-col lg="6">
                <span>schema</span>
                <br>
                <JsonView :data="decodedSchema"/>
              </b-col>
            </b-row>
          </b-container>
        </div>
        <div v-if="activetab === 3" class="tabcontent parameters-tab">
          <b-container>
            <b-row>
              <b-col lg="6">
                <span>schema</span>
                <br>
                <JsonView :data="parameterSchema"/>
              </b-col>
            </b-row>
          </b-container>
        </div>
      </div>-->
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
    "activetab",
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
    tab(value) {
      this.$emit("changeTab", value);
    }
  }
};
</script>

<style scoped>
/* Style the tabs */
.tabs {
  overflow: hidden;
  margin-bottom: -2px;
}

.tabs ul {
  list-style-type: none;
  margin-left: 20px;
}

.tabs a {
  float: left;
  cursor: pointer;
  padding: 12px 24px;
  transition: background-color 0.2s;
  border: 1px solid #ccc;
  border-right: none;
  background-color: #f1f1f1;
  font-weight: bold;
}
.tabs a:last-child {
  border-right: 1px solid #ccc;
}

/* Change background color of tabs on hover */
.tabs a:hover {
  background-color: #aaa;
  color: #fff;
}

/* Styling for active tab */
.tabs a.active {
  background-color: #fff;
  color: #484848;
  border-bottom: 2px solid #fff;
  cursor: default;
}

/* Style the tab content */
.tabcontent {
  padding-top: 10px;
  border: 1px solid #ccc;
  box-shadow: 3px 3px 6px #e1e1e1;
}

.storage-tab,
.parameters-tab {
  padding: 30px;
}

/* new era */

.tab-pane {
  outline: none;
}

.tabs .card-header {
  padding: 0rem 1.25rem;
}

.styled-row {
  border-bottom: 10px solid rgba(0, 0, 0, 0.05);
}

.styled-row:last-of-type {
  border-bottom: none;
}

.magic-top-divider {
  height: 10px;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.05);
}
</style>

<style>
.card-header {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
