<template>
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
</template>

<script>
import ContractCode from "@/components/ContractCode.vue";

export default {
  name: "Script",
  props: ["address", "manager", "script", "parameterSchema", "decodedSchema"],
  components: {
    ContractCode
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
</style>
