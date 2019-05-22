<template>
  <b-col lg="12" class="mt-3">
    <div class="form-check form-check-inline">
      <input class="form-check-input" type="radio" value="main" v-model="tezosNet">
      <label class="form-check-label" for="exampleRadios1">MainNet</label>
    </div>
    <div class="form-check form-check-inline">
      <input class="form-check-input" type="radio" value="alpha" v-model="tezosNet">
      <label class="form-check-label" for="exampleRadios2">AlphaNet</label>
      <button type="button" class="btn btn-link demo-btn" @click="demo">Pick Random Contract</button>
    </div>
    <div class="input-group mb-3 mt-2 input-address">
      <input
        v-model="address"
        type="text"
        class="form-control"
        placeholder="Enter KT-address"
        aria-label="kt-address"
      >
      <div class="input-group-append">
        <button type="button" class="btn btn-primary" @click="explore">Go</button>
      </div>
    </div>
  </b-col>
</template>

<script>
export default {
  name: "SearchForm",
  props: {
    address: String,
    tezosNet: String
  },
  methods: {
    demo() {
      this.$emit("demo");
    },
    explore() {
      this.$emit("explore");
    }
  }
};
</script>

<style scoped>
.input-address {
  max-width: 450px;
}
.demo-btn {
  margin-left: 40px;
}
</style>
