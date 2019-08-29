<template>
  <b-navbar toggleable="lg" type="dark" class="w-100 green-navbar">
    <router-link to="/">
      <b-navbar-brand class="logo">
        BETTER CALL
        <span class="dev">DEV</span>
      </b-navbar-brand>
    </router-link>

    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav>
        <b-nav-item @click="demo">Pick Random Contract</b-nav-item>
      </b-navbar-nav>

      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">
        <b-nav-item-dropdown :text="currentNet" right class="mr-2">
          <b-dropdown-item
            v-for="option in tezosNets"
            :key="option.value"
            :value="option.value"
            @click="changeNet(option.value)"
          >{{option.text}}</b-dropdown-item>
        </b-nav-item-dropdown>

        <b-nav-form>
          <b-form-input
            size="sm"
            class="mr-sm-2 input-address"
            placeholder="Enter KT-address"
            v-model="localAddress"
            @input="$emit('update:address', localAddress)"
            @click="isActive = true"
            @blur="isActive = (localAddress !== '')"
            v-bind:class="{ active: isActive }"
            @keyup.enter="explore"
          ></b-form-input>
          <b-button size="sm" class="my-2 mr-5 my-sm-0" @click="explore">Go</b-button>
        </b-nav-form>

        <b-navbar-nav>
          <b-nav-item href="https://twitter.com/tezosbakingbad" target="_blank">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              width="16"
              height="16"
              focusable="false"
              role="img"
              class="navbar-nav-svg"
            >
              <title>Twitter</title>
              <g fill="currentColor">
                <path
                  d="M32,6.1c-1.2,0.5-2.4,0.9-3.8,1c1.4-0.8,2.4-2.1,2.9-3.6c-1.3,0.8-2.7,1.3-4.2,1.6C25.7,3.8,24,3,22.2,3 c-3.6,0-6.6,2.9-6.6,6.6c0,0.5,0.1,1,0.2,1.5C10.3,10.8,5.5,8.2,2.2,4.2c-0.6,1-0.9,2.1-0.9,3.3c0,2.3,1.2,4.3,2.9,5.5 c-1.1,0-2.1-0.3-3-0.8c0,0,0,0.1,0,0.1c0,3.2,2.3,5.8,5.3,6.4c-0.6,0.1-1.1,0.2-1.7,0.2c-0.4,0-0.8,0-1.2-0.1 c0.8,2.6,3.3,4.5,6.1,4.6c-2.2,1.8-5.1,2.8-8.2,2.8c-0.5,0-1.1,0-1.6-0.1C2.9,27.9,6.4,29,10.1,29c12.1,0,18.7-10,18.7-18.7 c0-0.3,0-0.6,0-0.8C30,8.5,31.1,7.4,32,6.1z"
                />
              </g>
            </svg>
          </b-nav-item>
          <b-nav-item href="https://github.com/baking-bad/better-call-dev/" target="_blank">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              width="16"
              height="16"
              focusable="false"
              role="img"
              class="navbar-nav-svg"
            >
              <title>GitHub</title>
              <g fill="currentColor">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M16,0.4c-8.8,0-16,7.2-16,16c0,7.1,4.6,13.1,10.9,15.2 c0.8,0.1,1.1-0.3,1.1-0.8c0-0.4,0-1.4,0-2.7c-4.5,1-5.4-2.1-5.4-2.1c-0.7-1.8-1.8-2.3-1.8-2.3c-1.5-1,0.1-1,0.1-1 c1.6,0.1,2.5,1.6,2.5,1.6c1.4,2.4,3.7,1.7,4.7,1.3c0.1-1,0.6-1.7,1-2.1c-3.6-0.4-7.3-1.8-7.3-7.9c0-1.7,0.6-3.2,1.6-4.3 c-0.2-0.4-0.7-2,0.2-4.2c0,0,1.3-0.4,4.4,1.6c1.3-0.4,2.6-0.5,4-0.5c1.4,0,2.7,0.2,4,0.5C23.1,6.6,24.4,7,24.4,7 c0.9,2.2,0.3,3.8,0.2,4.2c1,1.1,1.6,2.5,1.6,4.3c0,6.1-3.7,7.5-7.3,7.9c0.6,0.5,1.1,1.5,1.1,3c0,2.1,0,3.9,0,4.4 c0,0.4,0.3,0.9,1.1,0.8C27.4,29.5,32,23.5,32,16.4C32,7.6,24.8,0.4,16,0.4z"
                />
              </g>
            </svg>
          </b-nav-item>
        </b-navbar-nav>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>

<script>
import { demo } from "@/app/demoAddresses";

export default {
  name: "NavBar",
  data: () => ({
    isActive: false,
    localAddress: "",
    localNet: "",
    tezosNets: [
      { text: "MainNet", value: "main" },
      { text: "AlphaNet", value: "alpha" },
      { text: "Sandbox", value: "sandbox" }
    ],
    demoAddresses: demo
  }),
  props: {
    address: String,
    tezosNet: String
  },
  computed: {
    currentNet() {
      if (this.localNet === "main") {
        return "MainNet";
      } else if (this.localNet === "alpha") {
        return "AlphaNet";
      }
        return "Sandbox";
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
      this.localNet = item["net"];
      this.isActive = true;
      this.$router.push({ path: `/${this.localNet}/${this.localAddress}/operations` });
    },
    explore() {
      this.isActive = true;
      this.$router.push({ path: `/${this.localNet}/${this.localAddress}/operations` });
    },
    changeNet(value) {
      this.localNet = value;
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
.logo {
  font-family: "Roboto", sans-serif;
  font-weight: 300;
}

.dev {
  font-weight: 400;
}

.green-navbar {
  background-color: #76a34e;
}

.input-address {
  min-width: 350px;
  background: hsla(0, 0%, 100%, 0.16);
}

.input-address::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.form-control:focus {
  box-shadow: none;
}

.form-inline .active {
  background-color: #fff;
}

.active::placeholder {
  color: #525f5a;
}

.btn {
  border-radius: 0;
}

.form-control {
  border: none;
  border-radius: 0;
}
</style>
