<template>
  <b-col lg="12" class="mt-1">
    <b-row>
      <b-col lg="12">
        <b-navbar toggleable="lg" type="light" class="w-100">
          <router-link to="/">
            <b-navbar-brand class="hello-page">
              BETTER CALL
              <span class="dev">DEV</span>
            </b-navbar-brand>
          </router-link>

          <b-collapse id="nav-collapse" is-nav>
            <!-- Right aligned nav items -->
            <b-navbar-nav class="ml-auto">
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
                    <g fill="#76a34e">
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
                    <g fill="#76a34e">
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
      </b-col>
    </b-row>
    <b-row>
      <b-col lg="12" class="text-center">
        <img
          width="200"
          src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/9bacdc23957341.5632ba9070591.jpg"
        />
      </b-col>
    </b-row>
    <b-row>
      <b-col lg="6" offset-lg="3" class="text-center">
        <b-alert show variant="danger" v-if="hasError">Looks like contract address is wrong</b-alert>
        <b-input-group class="mt-3" :class="{ 'has-error': hasError }">
          <b-form-input
            placeholder="Enter KT-address"
            v-model="localAddress"
            @input="$emit('update:address', localAddress)"
            @keyup.enter="explore"
            @click="hasError = false"
            @blur="hasError = false"
          ></b-form-input>
          <b-input-group-append>
            <b-dropdown slot="prepend" :text="currentNet" variant="outline-success">
              <b-dropdown-item
                v-for="option in tezosNets"
                :key="option.value"
                :value="option.value"
                @click="changeNet(option.value)"
              >{{option.text}}</b-dropdown-item>
            </b-dropdown>
          </b-input-group-append>
        </b-input-group>
        <div class="mt-4">
          <b-button variant="success" class="mr-3" @click="explore">Search</b-button>
          <b-button variant="outline-success" @click="demo">Pick Random Contract</b-button>
        </div>
      </b-col>
    </b-row>
    <b-row>
      <b-col lg="12" class="text-center">
        <div class="logo-author">
          Picture by
          <a href="https://www.behance.net/gallery/23957341/href" target="_blank">
            Guillermo
            Prestegui
          </a>
        </div>
      </b-col>
    </b-row>
  </b-col>
</template>

<script>
import { demo } from "@/app/demoAddresses";

export default {
  name: "Landing",
  data: () => ({
    localAddress: "",
    localNet: "alpha",
    tezosNets: [{ text: "MainNet", value: "main" }, { text: "AlphaNet", value: "alpha" }],
    hasError: false,
    demoAddresses: demo
  }),
  computed: {
    currentNet() {
      if (this.localNet === "main") {
        return "MainNet";
      }
      return "AlphaNet";
    }
  },
  beforeMount() {
    // backward compatibility
    if (this.$router.history.current.hash !== "") {
      let hash = this.$router.history.current.hash.slice(1);
      let url = hash.split(":");

      this.$router.replace({ path: `/${url[0]}/${url[1]}` });
    }
  },
  methods: {
    explore() {
      console.log("TEST LINTER")
      if (
        this.localAddress.length !== 36 ||
        this.localAddress[0] !== "K" ||
        this.localAddress[1] !== "T"
      ) {
        this.hasError = true;
        return;
      }

      this.$router.push({ path: `/${this.localNet}/${this.localAddress}` });
    },
    demo() {
      let pick = randomInteger(0, this.demoAddresses.length - 1);
      let item = this.demoAddresses[pick];

      this.$router.push({ path: `/${item["net"]}/${item["address"]}` });
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

<style>
.logo-author {
  font-size: 10px;
  color: rgb(133, 133, 133);
  margin-top: 10rem;
}

.dev {
  font-weight: 400;
}

.navbar-light .hello-page {
  color: #76a34e;
}

.btn-success {
  background-color: #76a34e;
  border-color: #76a34e;
  border-radius: 0;
}

.btn-success:hover {
  background-color: #5b942a;
  border-color: #649b34;
}

.btn-outline-success {
  color: #76a34e;
  border-color: #76a34e;
  border-radius: 0;
}

.btn-outline-success:hover,
.btn-outline-success:active {
  background-color: #76a34e;
  border-color: #649b34;
}

.btn-outline-success:not(:disabled):not(.disabled).active:focus,
.btn-outline-success:not(:disabled):not(.disabled):active:focus,
.show > .btn-outline-success.dropdown-toggle:focus,
.btn-outline-success:focus {
  box-shadow: none;
}

.alert,
.form-control {
  border-radius: 0;
}

.form-control:focus,
.form-control:focus + .input-group-append .btn {
  border-color: #76a34e;
  box-shadow: inset 0 1px 1px rgba(255, 191, 25, 0.25), 0 0 0.2rem #76a34e;
}

.has-error > .form-control {
  border-color: #a94442;
}
</style>
