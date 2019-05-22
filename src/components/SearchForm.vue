<template>
  <b-col lg="12" class="mt-3">
    <b-form-group>
      <b-form-radio-group
        id="radio-group"
        v-model="localNet"
        :options="tezosNets"
        name="radio-options"
        @change="radio"
      >
        <b-button variant="link" @click="demo">Pick Random Contract</b-button>
      </b-form-radio-group>
    </b-form-group>
    <div class="input-group mb-3 mt-2 input-address">
      <input
        v-model="localAddress"
        @input="$emit('update:address', localAddress)"
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
  data: () => ({
    localAddress: "",
    localNet: "",
    tezosNets: [
      { text: "MainNet", value: "main" },
      { text: "AlphaNet", value: "alpha" }
    ],
    demoAddresses: [
      {
        net: "alpha",
        address: "KT1SufMDx6d2tuVe3n6tSYUBNjtV9GgaLgtV"
      },
      {
        net: "alpha",
        address: "KT1FU74GimCeEVRAEZGURb6TWU8jK1N6zFJy"
      },
      {
        net: "alpha",
        address: "KT19iGCL4YrVpT6ezEzbDH37Yxbas8jWQz4s"
      },
      {
        net: "alpha",
        address: "KT1QiAJocHUKYN29BegaCnCaSQ9FT2ZXGfuJ"
      },
      {
        net: "alpha",
        address: "KT1HnvV5Z53naoh51jYvPF7w168nW8nfyx5v"
      },
      {
        net: "alpha",
        address: "KT19yAMFum5MmD99kusQiCBGpTEVC1B52f9Q"
      },
      {
        net: "alpha",
        address: "KT1Sefu81jFomBUTiJgK6VvCyY5rGrkhPszt"
      },
      {
        net: "alpha",
        address: "KT1TpKkwKzGwMrWrGnPp9KixhraD2dtE5wE5"
      },
      {
        net: "alpha",
        address: "KT1P3j1VonQytW3b2SzCnGVpjdf3oWajM79E"
      },
      {
        net: "alpha",
        address: "KT1XtauF2tnmAKBzbLA2gNoMji9zSzSyYq9w"
      },
      {
        net: "alpha",
        address: "KT1Qx7PRNAVHgam1qb2MuJohggnSdHTeBWyc"
      },
      {
        net: "main",
        address: "KT1Q1kfbvzteafLvnGz92DGvkdypXfTGfEA3"
      },
      {
        net: "main",
        address: "KT1BvVxWM6cjFuJNet4R9m64VDCN2iMvjuGE"
      }
    ]
  }),
  props: {
    address: String,
    tezosNet: String
  },
  watch: {
    localAddress(address) {
      this.$emit("update", address);
    }
  },
  beforeMount() {
    this.localAddress = this.address;
    this.localNet = this.tezosNet;
  },
  methods: {
    demo() {
      let pick = randomInteger(0, this.demoAddresses.length - 1);
      let item = this.demoAddresses[pick];

      this.localAddress = item["address"];
      this.$emit("demo", item);
    },
    explore() {
      this.$emit("explore");
    },
    radio(value) {
      this.localNet = value;
      this.$emit("updateNet", value);
    }
  }
};

function randomInteger(min, max) {
  let rand = min + Math.random() * (max + 1 - min);
  rand = Math.floor(rand);
  return rand;
}
</script>

<style scoped>
.input-address {
  max-width: 450px;
}
.demo-btn {
  margin-left: 40px;
}
.btn-link {
  margin-bottom: 3px;
}
</style>
