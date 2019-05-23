<template>
  <b-col lg="12" class="mb-3" v-if="status">
    <div id="tabs">
      <div class="tabs">
        <a @click="tab(1)" :class="[ activetab === 1 ? 'active' : '' ]">Operations</a>
        <a @click="tab(2)" :class="[ activetab === 2 ? 'active' : '' ]">Storage</a>
        <a @click="tab(3)" :class="[ activetab === 3 ? 'active' : '' ]">Parameters</a>
      </div>

      <div class="content">
        <div v-if="activetab === 1" class="tabcontent">
          <b-container>
            <b-row class="styled-row" v-for="(group, hash) in groups" :key="group.level">
              <b-col lg="2">
                <GroupInfo :group="group" :hash="hash"/>
              </b-col>
              <b-col lg="10" class="mb-3">
                <b-row v-for="tx in group['operations']" :key="tx.hash">
                  <TxInfo
                    :tx="tx"
                    :gasLimit="group.gasLimit"
                    :address="address"
                    :tezosNet="tezosNet"
                  />
                  <!-- <b-col lg="6" style="font-size: 75%;">
                    <br>
                    <br>big_map_diff
                    <br>
                    <JsonView :data="tx.decodedBigMapDiff"/>
                  </b-col>-->
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
      </div>
    </div>
  </b-col>
</template>

<script>
import JsonView from "./JsonView.vue";
import GroupInfo from "./GroupInfo.vue";
import TxInfo from "./TxInfo.vue";

export default {
  name: "Results",
  components: {
    JsonView,
    GroupInfo,
    TxInfo
  },
  props: {
    address: String,
    tezosNet: String,
    status: Boolean,
    activetab: Number,
    groups: Object,
    morePages: Boolean,
    decodedData: Object,
    decodedSchema: Object,
    parameterSchema: Object
  },
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
  border-bottom: none;
  box-shadow: 3px 3px 6px #e1e1e1;
}

.one-four-six {
  font-size: 146%;
}

.storage-tab,
.parameters-tab {
  padding: 30px;
}

.styled-row {
  border-bottom: 1px solid #ccc;
  margin-top: 15px;
}
</style>
