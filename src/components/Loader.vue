<template>
  <loading :active.sync="status" :can-cancel="true" :is-full-page="true" color="#76a34e"></loading>
</template>

<script>
import Loading from "vue-loading-overlay";
import "vue-loading-overlay/dist/vue-loading.css";

export default {
  name: "Loader",
  components: {
    Loading
  },
  props: {
    status: Boolean
  }
};
</script>

<style scoped>
</style>
