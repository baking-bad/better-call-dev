<template>
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
              <div class="mr-4">
                <div class="my-subtitle">Delegate</div>
                <span style="font-size: 75%;">{{ contractDelegate }}</span>
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
                      <TreeView :data="decodedData" max-length="120" max-depth="2" />
                    </div>
                  </div>
                </b-col>
                <b-col lg="6">
                  <b-alert class="mt-3" variant="info" show style="font-size: 75%;">
                    BigMap records loaded on the operations tab are displayed.
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
</template>

<script>
import utils from "@/app/utils";
import TreeView from "@/components/TreeView.vue";

export default {
  name: "State",
  props: ["delegate", "latestGroup", "decodedData", "morePages"],
  components: {
    TreeView
  },
  methods: {
    loadMore() {
      this.$emit("loadmore");
    },
    formatXTZ(amount) {
      return utils.formatXTZ(amount);
    }
  },
  computed: {
    contractDelegate() {
      return this.delegate || "Not delegated";
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

.storage-tree-view {
  margin-left: -18px;
  white-space: pre;
  font-size: 14px;
  font-family: "Roboto Mono", monospace;
}
</style>
