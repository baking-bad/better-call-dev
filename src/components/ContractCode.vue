<template>
  <b-col lg="12">
    <div class="my-title mt-3">
      <span>Contract script</span>
    </div>
    <b-row class="mt-2">
      <b-col lg="12">
        <div class="mb-2" style="display: flex;">
          <div class="mr-4">
            <div class="my-subtitle">Address</div>
            <span class="tx-hash">
              <mark>{{ address }}</mark>
            </span>
          </div>
          <div class="mr-4">
            <div class="my-subtitle">Manager</div>
            <span class="tx-hash">
              <span>{{ manager }}</span>
            </span>
          </div>
        </div>
      </b-col>
      <b-col lg="12" class="mb-3">
        <b-card>
          <b-row>
            <b-col lg="5">
              <div class="my-subtitle">Parameter</div>
              <div class="scheme-tree-view">
                <TreeView :data="parameterSchema" max-length="64" max-depth="5" />
              </div>
            </b-col>
            <b-col lg="7">
              <div>
                <div class="my-subtitle">Storage</div>
                <div class="scheme-tree-view">
                  <TreeView :data="decodedSchema" max-length="64" max-depth="5" />
                </div>
              </div>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
    <b-row>
      <b-col lg="12" class="mb-2 pb-2">
        <b-card>
          <b-alert variant="warning" show style="font-size: 75%;">
            <b>NOTE:</b> This is not a valid Michelson code, but an extended version, adapted for reading.
          </b-alert>
          <div class="my-subtitle">Code</div>
          <div class="micheline-wrapper">
            <MichelineViewItem :data="getCode()" :depth="1" :path="0" />
          </div>
        </b-card>
      </b-col>
    </b-row>
  </b-col>
</template>

<script>
import TreeView from "./TreeView.vue";
import MichelineViewItem from "./MichelineView.vue";

export default {
  name: "ContractCode",
  components: {
    TreeView,
    MichelineViewItem
  },
  props: ["address", "manager", "script", "parameterSchema", "decodedSchema"],
  methods: {
    getCode: function() {
      return this.script.code[2].args[0];
    }
  }
};
</script>

<style>
.micheline-wrapper {
  max-width: 1024px;
  white-space: normal;
  overflow-wrap: normal;
}

.scheme-tree-view {
  margin-left: -18px;
  font-size: 14px;
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
</style>
