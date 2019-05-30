<template>
  <div class="tree-view-wrapper">
    <!-- <TreeViewItem
      class="tree-view-item-root"
      :data="diffData()"
      :max-depth="maxDepth"
      :currentDepth="0"
    />-->
    <JsonView :data="this.oldData"/>
    <span>----------------</span>
    <JsonView :data="this.newData"/>
    <span>----------------</span>
    <JsonView :data="this.makeDiff(this.oldData, this.newData, 'storage', 'none')"/>
    <!-- <TreeViewItem
      class="tree-view-item-root"
      :data="this.makeDiff(this.oldData, this.newData, 'storage', 'none')"
      :max-depth="maxDepth"
      :currentDepth="0"
    />-->

    <div>{{this.makeDiff(this.oldData, this.newData, 'storage', 'none')}}</div>
  </div>
</template>

<script>
import _ from "lodash";
import TreeViewItem from "./TreeViewItem.vue";
import JsonView from "./JsonView.vue";
// import diff from "rfc6902-json-diff";
// import { createPatch } from "rfc6902";

export default {
  name: "PatchView",
  components: {
    TreeViewItem,
    JsonView
  },
  data: () => ({
    oldData: {
      a: "hello",
      b: "arr",
      c: [2, 3]
    },
    newData: {
      b: "why",
      c: [1, 2, 3, { g: 4 }],
      d: [{ f: 0 }]
    }
  }),
  props: ["prevData", "data", "max-depth"],
  methods: {
    makeDiff: function(a, b, key, op) {
      if (this.isObject(a) && this.isObject(b)) {
        let unionKeys = [...new Set(Object.keys(a).concat(Object.keys(b)))];
        let children = [];

        unionKeys.forEach(function(k) {
          if (a[k] === undefined) {
            children.push(this.makeDiff(undefined, b[k], k, "add"));
          } else if (b[k] === undefined) {
            children.push(this.makeDiff(a[k], undefined, k, "remove"));
          } else if (a[k] != b[k]) {
            children.push(this.makeDiff(a[k], b[k], k, "replace"));
          } else {
            children.push(this.transform(undefined, a[k], k, "none"));
          }
        }, this);

        return {
          key: key,
          type: "object",
          op: op,
          children: children
        };
      } else if (this.isArray(a) && this.isArray(b)) {
        return {
          key: key,
          type: "array",
          op: op,
          children: this.generateArrayChildren(a, b)
        };
      } else {
        if (a === undefined) {
          return this.transform(undefined, b, key, "add");
        }

        if (b === undefined) {
          return this.transform(a, undefined, key, "remove");
        }

        if (a != b) {
          return this.transform(a, b, key, "replace");
        }

        return this.transform(a, b, key, "none");
      }
    },
    transform: function(prevValue, value, key, op) {
      if (op === "add") {
        if (this.isValue(value)) {
          return {
            key: key,
            type: "value",
            value: value,
            op: op
          };
        }

        if (this.isObject(value)) {
          return this.transformObject(value, key, op);
        }

        if (this.isArray(value)) {
          return this.transformArray(value, key, op);
        }
      } else if (op === "remove") {
        if (this.isValue(prevValue)) {
          return {
            key: key,
            type: "value",
            prevValue: prevValue,
            op: op
          };
        }

        if (this.isObject(prevValue)) {
          return this.transformObject(prevValue, key, op);
        }

        if (this.isArray(prevValue)) {
          return this.transformArray(prevValue, key, op);
        }
      } else if (op === "replace") {
        if (this.isValue(prevValue)) {
          return {
            key: key,
            type: "value",
            value: value,
            prevValue: prevValue,
            op: op
          };
        }
      } else if (op === "none") {
        if (this.isValue(value)) {
          return {
            key: key,
            type: "value",
            value: value,
            op: op
          };
        }

        if (this.isObject(value)) {
          return this.transformObject(value, key, op);
        }

        if (this.isArray(value)) {
          return this.transformArray(value, key, op);
        }
      }
    },
    generateArrayChildren: function(from, to) {
      let matrix = this.generateMatrix(from, to);
      let children = this.matrixToChildren(matrix, from.length - 1, to.length - 1, from, to);

      return children;
    },
    matrixToChildren: function(matrix, i, j, from, to) {
      if (i === 0 && j === 0) {
        return [];
      } else if (i === 0) {
        return this.matrixToChildren(matrix, i, j - 1, from, to).concat(
          this.transform(from[i], to[j], j, "add")
        );
      } else if (j === 0) {
        return this.matrixToChildren(matrix, i - 1, j, from, to).concat(
          this.transform(from[i], to[j], j - 1, "remove")
        );
      } else {
        var left = matrix[i][j - 1];
        var up = matrix[i - 1][j];
        var upleft = matrix[i - 1][j - 1];

        if (upleft <= up && upleft <= left) {
          if (upleft === matrix[i][j]) {
            return this.matrixToChildren(matrix, i - 1, j - 1, from, to).concat(
              this.transform(from[i], to[j], j - 1, "none")
            );
          } else {
            return this.matrixToChildren(matrix, i - 1, j - 1, from, to).concat(
              this.transform(from[i], to[j], j - 1, "replace")
            );
          }
        } else if (left <= upleft && left <= up) {
          return this.matrixToChildren(matrix, i, j - 1, from, to).concat(
            this.transform(from[i], to[j], j - 1, "add")
          );
        } else {
          return this.matrixToChildren(matrix, i - 1, j, from, to).concat(
            this.transform(from[i], to[j], j - 1, "remove")
          );
        }
      }
    },
    generateMatrix: function(from, to) {
      if (this.isEqual(from, to)) {
        return null;
      }

      var m = from.length;
      var n = to.length;
      var d = this.makeRange(0, m + 1).map(function(x) {
        return [x];
      });

      d[0] = this.makeRange(0, n + 1);

      for (var i = 1; i <= m; i++) {
        for (var j = 1; j <= n; j++) {
          var replacementCost = 1;

          if (this.isEqual(from[i - 1], to[j - 1])) {
            replacementCost = 0;
          }

          d[i][j] = this.getMin([
            d[i - 1][j - 1] + replacementCost,
            d[i - 1][j] + 1,
            d[i][j - 1] + 1
          ]);
        }
      }

      return d;
    },
    // Transformer for the non-Collection types,
    // like String, Integer of Float
    transformValue: function(valueToTransform, keyForValue, operation) {
      return {
        key: keyForValue,
        type: "value",
        value: valueToTransform,
        op: operation
      };
    },

    // Since we use lodash, the _.map method will work on
    // both Objects and Arrays, returning either the Key as
    // a string or the Index as an integer
    generateChildrenFromCollection: function(collection, operation) {
      return _.map(collection, (value, keyOrIndex) => {
        if (this.isObject(value)) {
          return this.transformObject(value, keyOrIndex, operation);
        }
        if (this.isArray(value)) {
          return this.transformArray(value, keyOrIndex, operation);
        }
        if (this.isValue(value)) {
          return this.transformValue(value, keyOrIndex, operation);
        }
      });
    },

    // Transformer for the Array type
    transformArray: function(arrayToTransform, keyForArray, op) {
      return {
        key: keyForArray,
        type: "array",
        op: op,
        children: this.generateChildrenFromCollection(arrayToTransform, op)
      };
    },

    // Transformer for the Object type
    transformObject: function(objectToTransform, keyForObject, op, isRootObject = false) {
      return {
        key: keyForObject,
        type: "object",
        isRoot: isRootObject,
        op: op,
        children: this.generateChildrenFromCollection(objectToTransform, op)
      };
    },

    // Helper Methods for value type detection
    isObject: function(value) {
      return _.isPlainObject(value);
    },

    isArray: function(value) {
      return _.isArray(value);
    },

    isEqual: function(a, b) {
      return _.isEqual(a, b);
    },

    makeRange: function(from, to) {
      return _.range(from, to);
    },

    getMin: function(arr) {
      return _.min(arr);
    },

    isValue: function(value) {
      return !this.isObject(value) && !this.isArray(value);
    },

    // diffData: function() {
    //   // let patchGroup = diff(this.prevData, this.data);
    //   let patchGroup = createPatch(first, second);
    //   console.log("GREAT DIFFFF", patchGroup);
    //   let result = this.parsedData;
    //   console.log("TREE", result);

    //   patchGroup.forEach(function(patch) {
    //     let splitPath = patch.path.split("/").slice(1);
    //     if (patch.path != "") {
    //       result = this.insertPatch(result, splitPath, patch.op, patch.value);
    //     }
    //   }, this);

    //   return result;
    // },

    insertPatch: function(data, path, operation, value) {
      let current = path.shift();
      //  content      /0

      if (path.length === 0) {
        if (operation === "add") {
          data.children.push({
            key: current,
            type: "value",
            value: value,
            op: operation
          });
          return data;
        } else if (operation === "replace") {
          data.children.forEach(function(item) {
            if (item.key === current) {
              item.newValue = value;
              item.op = operation;
            }
          });
          return data;
        } else if (operation === "remove") {
          data.children.forEach(function(item) {
            if (item.key === current) {
              item.op = operation;
            }
          });
          return data;
        }
      }

      data.children.forEach(function(item) {
        if (item.key.toString() === current) {
          item = this.insertPatch(item, path, operation, value);
        }
      }, this);

      return data;
    }
  }
  // mounted() {
  //   let res = this.makeDiff(this.oldData, this.newData, "storage", undefined);
  //   // eslint-disable-next-line
  //   console.log("RESULT:", res);
  // }
  // computed: {
  //   parsedData: function() {
  //     // Take the JSON data and transform
  //     // it into the Tree View DSL
  //     // if (this.isValue(this.prevData)) {
  //     //   return this.transformValue(this.prevData, "parameter");
  //     // }
  //     // return this.transformObject(this.prevData, "parameters", true);
  //     if (this.isValue(first)) {
  //       return this.transformValue(first, "parameter");
  //     }
  //     return this.transformObject(first, "parameters", true);
  //   }
  // }
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
