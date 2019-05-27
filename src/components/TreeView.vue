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
      // Take the JSON data and transform
      // it into the Tree View DSL
      if (this.isValue(this.data)) {
        return this.transformValue(this.data, "parameter");
      }
      return this.transformObject(this.data, "parameters", true);
    }
  }
};
</script>

<style scoped>
/* The Tree View should only fill out available space, scroll when 
   necessary.
*/

.tree-view-item {
  font-family: monospace;
  font-size: 14px;
  margin-left: 18px;
}

.tree-view-wrapper {
  overflow: auto;
}

/* Find the first nested node and override the indentation */
.tree-view-item-root > .tree-view-item-leaf > .tree-view-item {
  margin-left: 0;
}

/* Root node should not be indented */
.tree-view-item-root {
  margin-left: 0;
}

.tree-view-item-node {
  cursor: pointer;
  position: relative;
  white-space: nowrap;
}

.tree-view-item-leaf {
  white-space: nowrap;
}

.tree-view-item-key {
  font-weight: bold;
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
