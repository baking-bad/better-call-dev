<template>
  <div class="tree-view-item">
    <div v-if="isObject(data)" :class="'tree-view-item-leaf ' + getColor(data.op)">
      <div class="tree-view-item-node" @click.stop="toggleOpen()">
        <span
          :class="{opened: isOpen(), prim: isPrim(data.key), index: isIndex(data.key)}"
          v-if="!isRootObject(data)"
          class="tree-view-item-key tree-view-item-key-with-chevron"
        >{{getKey(data)}}</span>
        <span 
          class="prim" 
          v-show="data.comment && data.comment !== data.key">
          {{data.comment}}&nbsp;
        </span>
        <span
          class="tree-view-item-hint"
          v-show="!isOpen() && data.children.length === 1"
        >{{data.children.length}} property</span>
        <span
          class="tree-view-item-hint"
          v-show="!isOpen() && data.children.length !== 1"
        >{{data.children.length}} properties</span>
      </div>
      <TreeViewItem
        :max-depth="maxDepth"
        :max-length="maxLength-2"
        :current-depth="currentDepth+1"
        v-show="isOpen()"
        v-for="child in data.children"
        :data="child"
        :key="child.id"
      />
    </div>
    <div v-if="isArray(data)" :class="'tree-view-item-leaf ' + getColor(data.op)">
      <div class="tree-view-item-node array-node" @click.stop="toggleOpen()">
        <span
          :class="{opened: isOpen(), prim: isPrim(data.key), index: isIndex(data.key)}"
          v-if="!isRootObject(data)"
          class="tree-view-item-key tree-view-item-key-with-chevron"
        >{{getKey(data)}}</span>
        <span
          class="tree-view-item-hint"
          v-show="!isOpen() && data.children.length === 1"
        >{{data.children.length}} item</span>
        <span
          class="tree-view-item-hint"
          v-show="!isOpen() && data.children.length !== 1"
        >{{data.children.length}} items</span>
      </div>
      <TreeViewItem
        :max-depth="maxDepth"
        :max-length="maxLength-2"
        :current-depth="currentDepth+1"
        v-show="isOpen()"
        v-for="child in data.children"
        :data="child"
        :key="child.id"
      />
    </div>
    <div
      style="word-wrap: break-word"
      :class="'tree-view-item-leaf ' + getColor(data.op)"
      v-if="isValue(data)"
    >
      <span
        class="tree-view-item-key"
        :class="{prim: isPrim(data.key), index: isIndex(data.key)}"
      >{{getKey(data)}}</span>
      <span 
        v-if="isLink(data.value)" 
        style="word-break: break-all;"
        class="tree-view-item-value make-big-data"
        ><a :href="getLink(data)" target="_blank">{{data.value}}</a>
      </span>
      <span 
        v-else-if="isLong(data)" 
        style="word-break: break-all;"
        class="tree-view-item-value make-big-data"
        @click="changeLen($event, data)"
      >{{getValue(data)}}</span>
      <span
        v-else
        style="word-break: break-all;"
        class="tree-view-item-value make-big-data"
      >{{getValue(data)}}</span>
    </div>
    <div
      style="word-wrap: break-word"
      :class="'tree-view-item-leaf ' + getColor(data.op)"
      v-if="isLambda(data)"
    >
      <span class="tree-view-item-key">{{getKey(data)}}</span>
      <button class="micheline-view-type" v-b-toggle.collapse-1>
        <span class="when-opened">hide</span>
        <span class="when-closed">show</span>
      </button>
      <b-collapse id="collapse-1">
        <MichelineViewItem :data="data.lambda" :depth="1" :path="0"/>
      </b-collapse>
    </div>
    <div
      style="word-wrap: break-word"
      :class="'tree-view-item-leaf ' + getColor(data.op)"
      v-if="isConst(data)"
    >
      <span class="tree-view-item-key tree-view-item-const">{{getConst(data)}}</span>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import MichelineViewItem from "./MichelineView.vue";
import { sanitizeUrl } from '@braintree/sanitize-url'

export default {
  name: "TreeViewItem",
  components: {
    MichelineViewItem
  },
  props: ["data", "max-depth", "current-depth", "max-length"],
  data: function() {
    return {
      open: this.currentDepth < this.maxDepth && this.data.op !== "none"
    };
  },
  methods: {
    formatLiqEntry: function(key) {
      if (_.isString(key) && key.includes("_Liq_entry_")) {
        return key.substring(11);
      }
      return key;
    },

    changeLen: function(e, data) {
      let target = e.currentTarget;
      let res = "";

      if (data.op === undefined || data.op === "none" || data.op === "add") {
        res = data.value;
      }
      if (data.op === "remove") {
        res = data.value;
      }
      if (data.op === "replace") {
        res = `${data.prevValue} => ${data.value}`;
      }
      if (_.isNull(data.value)) {
        res = "null";
      }
      if (_.isString(data.value)) {
        // i am alive
      }
      target.innerHTML = res;
    },
    isLong: function(value) {
      if (value.type === "value" && _.isString(value.value)) {
        return value.value.length > this.maxLength - value.key.length;
      }
      return false;
    },
    makeShort: function(str, key) {
      if (str.length > this.maxLength - key.length) {
        return str.substr(0, 7) + "..." + str.substr(str.length - 7, 7);
      }
      return str;
    },
    isOpen: function() {
      let flag = true;
      if (this.data.children !== undefined) {
        if (this.data.children.length === 0) {
          flag = false;
        }
      }
      return (this.isRootObject(this.data) || this.open) && flag;
    },
    isPrim: function(value) {
      return ["map", "big_map", "list", "set", "option", "lambda", "contract", "or"].includes(
        value
      );
    },
    toggleOpen: function() {
      this.open = !this.open;
    },
    isObject: function(value) {
      return value.type === "object";
    },
    isArray: function(value) {
      return value.type === "array";
    },
    isValue: function(value) {
      return value.type === "value";
    },
    isConst: function(value) {
      return value.type === "const";
    },
    isLambda: function(value) {
      return value.type === "lambda";
    },
    getConst: function(value) {
      return this.formatLiqEntry(value.const);
    },
    getKey: function(value) {
      if (value.key === "") {
        value.key = "<empty>";
      }
      return this.formatLiqEntry(value.key + ": ");
    },
    getLink: function(value) {
      return sanitizeUrl(value.value);
    },
    getValue: function(value) {
      if (value.op === "remove") {
        return this.makeShort(value.value, value.key);
      }
      if (value.op === "replace") {
        return `${this.makeShort(value.prevValue, value.key)} => ${this.makeShort(value.value, value.key)}`;
      }
      if (_.isNumber(value.value)) {
        return this.makeShort(value.value, value.key);
      }
      if (_.isNull(value.value)) {
        return "null";
      }
      if (_.isString(value.value)) {
        // do nothing
      }
      return this.makeShort(value.value, value.key);
    },
    isRootObject: function(value) {
      return value.isRoot;
    },
    isIndex: function(value) {
      return _.isInteger(value);
    },
    isLink: function(value) {
      return _.isString(value) && value.startsWith('http');
    },
    getColor(op) {
      if (op === "add") {
        return "green-bg";
      } else if (op === "replace") {
        return "yellow-bg";
      } else if (op === "remove") {
        return "red-bg";
      }
      return "";
    }
  }
};
</script>

<style scoped>
.make-big-data {
  cursor: pointer;
}

.green-bg {
  background-color: #d4edda;
  color: #155724;
}

.green-bg .tree-view-item-key {
  color: #155724;
}

.yellow-bg {
  background-color: #fff3cd;
  color: #856404;
}

.yellow-bg .tree-view-item-key {
  color: #856404;
}

.red-bg {
  background-color: #f8d7da;
  color: #721c24;
}

.red-bg .tree-view-item-key {
  color: #721c24;
}

.red-bg .tree-view-item-value,
.yellow-bg .tree-view-item-value,
.green-bg .tree-view-item-value {
  color: #000;
}

.tree-view-item-key {
  color: rgb(44, 44, 44);
}

.tree-view-item-value {
  color: rgb(107, 161, 59);
}

.tree-view-item {
  margin-left: 18px;
}

.tree-view-item-node {
  cursor: pointer;
  position: relative;
  white-space: nowrap;
}

.tree-view-item-key-with-chevron.opened::before {
  top: 4px;
  transform: rotate(90deg);
  -webkit-transform: rotate(90deg);
}

.tree-view-item-key-with-chevron::before {
  color: #ccc;
  content: "\25b6";
  font-size: 9px;
  left: -11px;
  position: absolute;
  top: 4px;
  transition: -webkit-transform 0.1s ease;
  transition: transform 0.1s ease;
  transition: transform 0.1s ease, -webkit-transform 0.1s ease;
  -webkit-transition: -webkit-transform 0.1s ease;
}

.tree-view-item-hint {
  color: #ccc;
}

.tree-view-item-const {
  color: rgb(107, 161, 59);
}

.prim {
  color: blueviolet;
}

.index {
  color: #888;
}

.tree-view-wrapper-chevron
  > .tree-view-item-root
  > .tree-view-item-leaf
  > .tree-view-item
  > .tree-view-item-leaf {
  margin-left: 12px;
}

.micheline-view-type {
  border: none;
  text-decoration: underline;
  padding: 0;
  margin: 0;
  color: blueviolet;
  cursor: pointer;
  font-weight: 300;
  background-color: transparent;
}

.micheline-view-type:hover {
  text-decoration: none;
}

.micheline-view-type:focus {
  box-shadow: none;
  outline: none;
}

.collapsed > .when-opened,
:not(.collapsed) > .when-closed {
  display: none;
}
</style>
