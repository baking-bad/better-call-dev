<template>
  <div :class="wrapperClass">
    <TreeViewItem class="tree-view-item-root" :data="diffData" :max-depth="7" :currentDepth="0"/>
  </div>
</template>

<script>
import _ from "lodash";
import TreeViewItem from "./TreeViewItem.vue";

export default {
  name: "PatchView",
  components: {
    TreeViewItem
  },
  props: ["prevData", "data", "max-depth"],
  methods: {
    makeDiff: function(a, b, key, op, isRoot = false) {
      if (this.isObject(a) && this.isObject(b)) {
        if (this.isLambda(a) && this.isLambda(b)) {
          // TODO: line by line diff
          return this.transformLambda(b, key, op);
        }

        let unionKeys = [...new Set(Object.keys(a).concat(Object.keys(b)))];
        let children = [];

        unionKeys.forEach(function(k) {
          if (a[k] === undefined) {
            children.push(this.makeDiff(undefined, b[k], k, "add"));
          } else if (b[k] === undefined) {
            children.push(this.makeDiff(a[k], undefined, k, "remove"));
          } else if (!this.isEqual(a[k], b[k])) {
            children.push(this.makeDiff(a[k], b[k], k, "deeper"));
          } else {
            children.push(this.transform(undefined, a[k], k, "none"));
          }
        }, this);

        return {
          key: key,
          type: "object",
          op: op,
          isRoot: isRoot,
          children: children
        };
      } else if (this.isArray(a) && this.isArray(b)) {
        if (this.isEqual(a, b)) {
          return this.transform(a, b, key, "none", isRoot);
        }
        return {
          key: key,
          type: "array",
          op: op,
          isRoot: isRoot,
          children: this.generateArrayChildren(a, b)
        };
      } else {
        if (a === undefined || a === null) {
          return this.transform(undefined, b, key, "add", isRoot);
        }

        if (b === undefined || b === null) {
          return this.transform(a, undefined, key, "remove", isRoot);
        }

        if (a != b) {
          return this.transform(a, b, key, "replace");
        }

        return this.transform(a, b, key, "none");
      }
    },
    transform: function(prevValue, value, key, op, isRoot = false) {
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
          return this.transformObject(value, key, op, isRoot);
        }

        if (this.isArray(value)) {
          return this.transformArray(value, key, op, isRoot);
        }
      } else if (op === "remove") {
        if (this.isValue(prevValue)) {
          return {
            key: key,
            type: "value",
            value: prevValue,
            op: op
          };
        }

        if (this.isObject(prevValue)) {
          return this.transformObject(prevValue, key, op, isRoot);
        }

        if (this.isArray(prevValue)) {
          return this.transformArray(prevValue, key, op, isRoot);
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

        return this.makeDiff(prevValue, value, key, "deeper", isRoot);
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
          return this.transformObject(value, key, op, isRoot);
        }

        if (this.isArray(value)) {
          return this.transformArray(value, key, op, isRoot);
        }
      }
    },
    generateArrayChildren: function(from, to) {
      let matrix = this.generateMatrix(from, to);
      let children = this.matrixToChildren(matrix, from.length, to.length, from, to);
      return children;
    },
    matrixToChildren: function(matrix, i, j, from, to) {
      if (i === 0 && j === 0) {
        return [];
      } else if (i === 0) {
        return this.matrixToChildren(matrix, i, j - 1, from, to).concat(
          this.transform(undefined, to[j - 1], j - 1, "add")
        );
      } else if (j === 0) {
        return this.matrixToChildren(matrix, i - 1, j, from, to).concat(
          this.transform(from[i - 1], undefined, j - 1, "remove")
        );
      } else {
        var left = matrix[i][j - 1];
        var up = matrix[i - 1][j];
        var upleft = matrix[i - 1][j - 1];

        if (upleft <= up && upleft <= left) {
          if (upleft === matrix[i][j]) {
            return this.matrixToChildren(matrix, i - 1, j - 1, from, to).concat(
              this.transform(from[i - 1], to[j - 1], j - 1, "none")
            );
          } else {
            return this.matrixToChildren(matrix, i - 1, j - 1, from, to).concat(
              this.transform(from[i - 1], to[j - 1], j - 1, "replace")
            );
          }
        } else if (left <= upleft && left <= up) {
          return this.matrixToChildren(matrix, i, j - 1, from, to).concat(
            this.transform(undefined, to[j - 1], j - 1, "add")
          );
        } else {
          return this.matrixToChildren(matrix, i - 1, j, from, to).concat(
            this.transform(from[i - 1], undefined, j - 1, "remove")
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

    transformValue: function(valueToTransform, keyForValue, operation) {
      return {
        key: keyForValue,
        type: "value",
        value: valueToTransform,
        op: operation
      };
    },

    transformLambda: function(lambdaToTransform, keyForLambda, operation) {
      return {
        key: keyForLambda,
        type: "lambda",
        lambda: lambdaToTransform.args,
        op: operation
      };
    },

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

    transformArray: function(arrayToTransform, keyForArray, op, isRootArray = false) {
      return {
        key: keyForArray,
        type: "array",
        isRoot: isRootArray,
        op: op,
        children: this.generateChildrenFromCollection(arrayToTransform, op)
      };
    },

    transformObject: function(objectToTransform, keyForObject, op, isRootObject = false) {
      if (this.isLambda(objectToTransform)) {
        return this.transformLambda(objectToTransform, keyForObject, op);
      }
      return {
        key: keyForObject,
        type: "object",
        isRoot: isRootObject,
        op: op,
        children: this.generateChildrenFromCollection(objectToTransform, op)
      };
    },

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

    isLambda: function(value) {
      return this.isObject(value) && value.prim === "Lambda";
    },

    insertPatch: function(data, path, operation, value) {
      let current = path.shift();

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
  },
  computed: {
    wrapperClass: function() {
      let klass = "tree-view-wrapper";
      let children = [];

      if (this.isArray(this.data)) {
        klass += " tree-view-wrapper-array";
        children = this.data;
      } else if (this.isObject(this.data)) {
        klass += " tree-view-wrapper-object";
        children = Object.values(this.data);
      }

      if (children.some(function(x) { return this.isArray(x) || this.isObject(x) }, this)) {
        klass += " tree-view-wrapper-chevron";
      }

      return klass;
    },
    diffData: function() {
      let a = JSON.parse(JSON.stringify(this.prevData));
      let b = JSON.parse(JSON.stringify(this.data));
      return this.makeDiff(a, b, "storage", "deeper", true);
    }
  }
};
</script>

<style scoped>
/* DIRTY HACK BEGIN */

.tree-view-wrapper-array {
  overflow: auto;
  margin-left: -18px;
}

.tree-view-wrapper-object {
  overflow: auto;
  margin-left: -18px;
}

/* DIRTY HACK END */
</style>
