<template>
  <b-col class="pl-0 pr-0" v-if="status">
    <!-- <div class="magic-top-divider"></div> -->
    <div class="tab-menu pl-4 pt-3">
      <router-link
        tag="button"
        to="operations"
        class="btn btn-outline-success btn-sm mr-2"
      >Operations</router-link>
      <router-link tag="button" to="script" class="btn btn-outline-success btn-sm mr-2">Script</router-link>
      <router-link tag="button" to="state" class="btn btn-outline-success btn-sm">State</router-link>
    </div>
    <router-view v-bind="myProps" />
    <!-- <div id="tabs"> -->

    <!-- <b-tab active class="pl-0 pr-0 pt-0">
          <template slot="title">
            <span v-b-tooltip.hover title="Operations">
              <font-awesome-icon icon="exchange-alt" />
            </span>
          </template>
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
        </b-tab>

        <b-tab title="Script" class="script pl-0 pr-0 pt-0 pb-0">
          <template slot="title">
            <span v-b-tooltip.hover title="Script">
              <font-awesome-icon icon="code" />
            </span>
          </template>
          <div class="tab-wrapper">
            <b-row class="styled-row">
              <ContractCode
                :address="address"
                :manager="manager"
                :script="script"
                :parameterSchema="parameterSchema"
                :decodedSchema="decodedSchema"
              />
            </b-row>
          </div>
    </b-tab>-->

    <!-- <b-tab title="State" class="state pl-0 pr-0 pt-0 pb-0">
          <template slot="title">
            <span v-b-tooltip.hover title="State">
              <font-awesome-icon icon="database" />
            </span>
          </template>
          <div class="tab-wrapper">
            <b-row class="styled-row">
              <b-col lg="12">
                <div class="my-title mt-3">
                  <span>Contract state</span>
                </div>
                <b-row class="mt-2">
                  <b-col lg="12">
                    <div class="mb-2" style="display: flex;">
                      <div class="mr-4">
                        <div class="my-subtitle">Last modified</div>
                        <span
                          style="font-size: 75%;"
                        >{{ latestGroup.date }}, {{ latestGroup.time }} at level {{ latestGroup.level }}</span>
                      </div>
                      <div class="mr-4">
                        <div class="my-subtitle">Balance</div>
                        <span style="font-size: 75%;">{{ formatXTZ(latestGroup.balance) }}</span>
                      </div>
                      <div class="mr-4">
                        <div class="my-subtitle">Storage size</div>
                        <span style="font-size: 75%;">{{ latestGroup.storageSize }}</span>
                      </div>
                    </div>
                  </b-col>
                  <b-col lg="12" class="mb-3">
                    <b-card>
                      <b-row>
                        <b-col lg="12">
                          <div>
                            <div class="my-subtitle">Storage</div>
                            <div class="storage-tree-view">
                              <TreeView :data="decodedData" max-length="120" max-depth="7" />
                            </div>
                          </div>
                        </b-col>
                        <b-col lg="6">
                          <b-alert class="mt-3" variant="info" show style="font-size: 75%;">
                            BigMap records loaded on the operation tab are displayed.
                            <button
                              class="loadMore-link"
                              v-if="morePages"
                              @click="loadMore"
                            >Load More</button>
                          </b-alert>
                        </b-col>
                      </b-row>
                    </b-card>
                  </b-col>
                </b-row>
              </b-col>
            </b-row>
          </div>
    </b-tab>-->
    <!-- </b-tabs> -->
    <!-- </div> -->
  </b-col>
</template>

<script>
import utils from "@/app/utils";
// import TreeView from "./TreeView.vue";
// import GroupInfo from "./GroupInfo.vue";
// import TxInfo from "./TxInfo.vue";
// import ContractCode from "./ContractCode.vue";

// import { library } from "@fortawesome/fontawesome-svg-core";
// import { faExchangeAlt, faCode } from "@fortawesome/free-solid-svg-icons";
// import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

// library.add(faExchangeAlt, faCode);

export default {
  name: "Results",
  components: {
    // TreeView,
    // GroupInfo,
    // TxInfo,
    // ContractCode,
    // FontAwesomeIcon
  },
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
/* .tab-pane {
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
} */
</style>

<style>
/* .card,
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
} */
</style>
