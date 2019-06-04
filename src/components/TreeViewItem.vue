<template>
  <div class="tree-view-item">
    <div v-if="isObject(data)" :class="'tree-view-item-leaf ' + getColor(data.op)">
      <div class="tree-view-item-node" @click.stop="toggleOpen()">
        <span
          :class="{opened: isOpen()}"
          v-if="!isRootObject(data)"
          class="tree-view-item-key tree-view-item-key-with-chevron"
        >{{getKey(data)}}</span>
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
        :current-depth="currentDepth+1"
        v-show="isOpen()"
        v-for="child in data.children"
        :data="child"
        :key="child.id"
      />
    </div>
    <div v-if="isArray(data)" :class="'tree-view-item-leaf ' + getColor(data.op)">
      <div class="tree-view-item-node" @click.stop="toggleOpen()">
        <span
          :class="{opened: isOpen()}"
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
      <span class="tree-view-item-key">{{getKey(data)}}</span>
      <span
        style="word-break: break-all;"
        class="tree-view-item-value make-big-data"
        @click="changeLen($event, data)"
      >{{getValue(data)}}</span>
    </div>
  </div>
</template>

<script>
import _ from "lodash";

export default {
  name: "TreeViewItem",
  props: ["data", "max-depth", "current-depth"],
  data: function() {
    return {
      open: this.currentDepth < this.maxDepth && this.data.op !== "none"
    };
  },
  methods: {
    formatLiqEntry: function(key) {
      if (key.includes("_Liq_entry_")) {
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
    makeShort: function(str) {
      if (str.length > 30) {
        return str.substr(0, 7) + "..." + str.substr(str.length - 7, 7);
      }
      return str;
    },
    isOpen: function() {
      return this.isRootObject(this.data) || this.open;
      // return (this.isRootObject(this.data) || this.open) && this.data.children.length > 0;
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
    getKey: function(value) {
      return this.formatLiqEntry(value.key + ": ");
    },
    getValue: function(value) {
      if (value.op === "remove") {
        return this.makeShort(value.value);
      }
      if (value.op === "replace") {
        return `${this.makeShort(value.prevValue)} => ${this.makeShort(value.value)}`;
      }
      if (_.isNumber(value.value)) {
        return this.makeShort(value.value);
      }
      if (_.isNull(value.value)) {
        return "null";
      }
      if (_.isString(value.value)) {
        // i am alive
      }
      return this.makeShort(value.value);
    },
    isRootObject: function(value) {
      return value.isRoot;
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
  background-color: rgba(40, 167, 69, 1);
}

.yellow-bg {
  background-color: rgba(255, 193, 7, 1);
}

.red-bg {
  background-color: rgba(220, 53, 69, 1);
}

.red-bg .tree-view-item-value,
.yellow-bg .tree-view-item-value,
.green-bg .tree-view-item-value {
  color: #000;
}

.tree-view-item-value {
  color: #28a745;
}

.tree-view-item {
  font-family: monospace;
  font-size: 14px;
  margin-left: 18px;
}

.tree-view-item-node {
  cursor: pointer;
  position: relative;
  white-space: nowrap;
}

.tree-view-item-key-with-chevron {
  padding-left: 14px;
}

.tree-view-item-key-with-chevron.opened::before {
  top: 4px;
  transform: rotate(90deg);
  -webkit-transform: rotate(90deg);
}

.tree-view-item-key-with-chevron::before {
  color: #444;
  content: "\25b6";
  font-size: 10px;
  left: 1px;
  position: absolute;
  top: 3px;
  transition: -webkit-transform 0.1s ease;
  transition: transform 0.1s ease;
  transition: transform 0.1s ease, -webkit-transform 0.1s ease;
  -webkit-transition: -webkit-transform 0.1s ease;
}

.tree-view-item-hint {
  color: #ccc;
}
</style>
