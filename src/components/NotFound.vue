<template>
  <b-col lg="6" offset-lg="3" class="mt-5 mb-3 text-center" v-if="status">
    <b-alert show variant="danger">
      Oops. No info for smart-contract
      <br>
      <b>{{ address }}</b> in
      <b>{{ currentNet }}</b>.
      <br>
      <br>Try to switch the net.
    </b-alert>
  </b-col>
</template>

<script>
export default {
  name: "NotFound",
  props: {
    status: Boolean,
    address: String,
    tezosNet: String
  },
  computed: {
    currentNet() {
      if (this.localNet === "main") {
        return "MainNet";
      }
      return "AlphaNet";
    }
  }
};
</script>

<style scoped>
.alert {
  border-radius: 0;
}
</style>
