<template>
  <b-col lg="12">
    <div class="my-title mt-3">
      <span>Contract</span>
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
              <div class="tx-info-tree-view">
                <JsonView :data="parameterSchema"/>
              </div>
            </b-col>
            <b-col lg="7">
              <div>
                <div class="my-subtitle">Storage</div>
                <div class="tx-info-tree-view">
                  <JsonView :data="decodedSchema"/>
                </div>
              </div>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
  </b-col>
</template>

<script>
import JsonView from "./JsonView.vue";

export default {
  name: "ContractCode",
  components: {
    JsonView
  },
  props: ["address", "manager", "parameterSchema", "decodedSchema"]
};
</script>

<style scoped>
</style>
