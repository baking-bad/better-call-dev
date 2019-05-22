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
            <b-row class="styled-row" v-for="group in groups" :key="group.level">
              <b-col lg="1">
                <div class="info-block">
                  <div class="one-four-six">{{ group.level }}</div>
                  <div>{{ group.date }}</div>
                  <div>{{ group.time }}</div>
                </div>
              </b-col>
              <b-col lg="11" class="mb-3">
                <b-row v-for="tx in group['operations']" :key="tx.hash">
                  <b-col lg="6">
                    <mark v-if="address == tx.source">{{ formatAddress(tx.source) }}</mark>
                    <a
                      v-else-if="tx.source.substring(0,3) == 'KT'"
                      target="_blank"
                      :href="baseAppURL + tx.source"
                    >{{ formatAddress(tx.source) }}</a>
                    <span v-else>{{ formatAddress(tx.source) }}</span>

                    <span style="font-size: 90%;">&nbsp;⟶&nbsp;</span>

                    <mark v-if="address == tx.destination">{{ formatAddress(tx.destination) }}</mark>
                    <a
                      v-else-if="tx.destination[0] == 'K'"
                      target="_blank"
                      :href="baseAppURL + tezosNet + ':' + tx.destination"
                    >{{ formatAddress(tx.destination) }}</a>
                    <span v-else>{{ formatAddress(tx.destination) }}</span>
                    <span style="font-size: 90%;">&nbsp;for</span>
                    {{ formatXTZ(tx.amount) }}
                    <span style="font-size: 90%;">with</span>
                    {{ formatXTZ(tx.fee) }}
                    <span
                      style="font-size: 90%;"
                    >fee&nbsp;</span>
                    <span v-if="tx.status" :class="'badge ' + badgeClass(tx.status)">{{ tx.status }}</span>
                    <br>
                    <div style="font-size: 75%;">
                      parameters
                      <br>
                      <JsonView :data="tx.decodedParameters"/>
                    </div>
                    <br>
                  </b-col>
                  <b-col lg="6" style="font-size: 75%;">
                    <br>
                    <br>big_map_diff
                    <br>
                    <JsonView :data="tx.decodedBigMapDiff"/>
                  </b-col>
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

export default {
  name: "Results",
  components: {
    JsonView
  },
  data: () => ({
    baseAppURL: "https://baking-bad.github.io/better-call-dev/#"
  }),
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
    },
    formatAddress(address) {
      return `${address.substr(0, 4)}...${address.substr(
        address.length - 4,
        4
      )}`;
    },
    formatXTZ(amount) {
      if (amount == 0 || amount == undefined) {
        return "0 ꜩ";
      }
      return `${(amount / Math.pow(10, 6)).toString()} ꜩ`;
    },
    badgeClass(status) {
      if (status == "failed") {
        return "badge-danger";
      }
      if (status == "skipped") {
        return "badge-warning";
      }
      if (status == "applied") {
        return "badge-success";
      }
      if (status == "backtracked") {
        return "badge-primary";
      }

      return "badge-secondary";
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

.info-block {
  font-size: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
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
