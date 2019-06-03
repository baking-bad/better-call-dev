<template>
  <div class="tree-view-wrapper">
    <TreeViewItem
      class="tree-view-item-root"
      :data="parsedData"
      :max-depth="maxDepth"
      :currentDepth="0"
    />
  </div>
</template>

<script>
import _ from "lodash";
import TreeViewItem from "./TreeViewItem.vue";

export default {
  name: "TreeView",
  components: {
    TreeViewItem
  },
  props: ["data", "max-depth"],
  methods: {
    // Transformer for the non-Collection types,
    // like String, Integer of Float
    transformValue: function(valueToTransform, keyForValue) {
      return {
        key: keyForValue,
        type: "value",
        value: valueToTransform
      };
    },

    // Since we use lodash, the _.map method will work on
    // both Objects and Arrays, returning either the Key as
    // a string or the Index as an integer
    generateChildrenFromCollection: function(collection) {
      return _.map(collection, (value, keyOrIndex) => {
        if (this.isObject(value)) {
          return this.transformObject(value, keyOrIndex);
        }
        if (this.isArray(value)) {
          return this.transformArray(value, keyOrIndex);
        }
        if (this.isValue(value)) {
          return this.transformValue(value, keyOrIndex);
        }
      });
    },

    // Transformer for the Array type
    transformArray: function(arrayToTransform, keyForArray) {
      return {
        key: keyForArray,
        type: "array",
        children: this.generateChildrenFromCollection(arrayToTransform)
      };
    },

    // Transformer for the Object type
    transformObject: function(objectToTransform, keyForObject, isRootObject = false) {
      return {
        key: keyForObject,
        type: "object",
        isRoot: isRootObject,
        children: this.generateChildrenFromCollection(objectToTransform)
      };
    },

    // Helper Methods for value type detection
    isObject: function(value) {
      return _.isPlainObject(value);
    },

    isArray: function(value) {
      return _.isArray(value);
    },

    isValue: function(value) {
      return !this.isObject(value) && !this.isArray(value);
    }
  },
  computed: {
    parsedData: function() {
      if (this.isValue(this.data)) {
        return this.transformArray([this.data], "parameter");
      }
      if (this.isArray(this.data)) {
        return this.transformArray(this.data, "parameter");
      }

      let keys = Object.keys(this.data);

      if (keys.length === 1) {
        let value = this.data[keys[0]];

        if (value === "Unit") {
          this.data[keys[0]] = [];
        } else if (this.isValue(value)) {
          this.data[keys[0]] = [value];
        }
      }

      return this.transformObject(this.data, "parameters", true);
    }
  }
};
</script>

<style scoped>
.tree-view-item-root {
  margin-left: 0;
}

.tree-view-item-root > .tree-view-item-leaf > .tree-view-item {
  margin-left: 0;
}

.tree-view-wrapper {
  margin-left: -15px;
  overflow: auto;
}
</style>
