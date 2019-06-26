<template>
  <span class="micheline-view-item">
    <span v-if="isArray(data)">
      <span>{&nbsp;</span> 
        <span v-if="isSimple(data) && data.length < 6">
          <span v-for="(arg, i) in data" :key="arg.id">
            <MichelineViewItem :data="arg" :depth="depth + 1"/>
            <span v-if="i < data.length - 1">;&nbsp;</span> 
          </span>
        </span>
        <span v-else>
          <br/>
          <span v-for="(arg, i) in data" :key="arg.id">
            <span v-for="j in Array(depth)" :key="j">&nbsp;&nbsp;</span>
            <MichelineViewItem :data="arg" :depth="depth + 1"/>
            <span v-if="i < data.length - 1">;<br/></span> 
          </span>
          <br/>
          <span v-for="j in Array(depth - 1)" :key="j">&nbsp;&nbsp;</span>
        </span>
      <span>}&nbsp;</span>
    </span>
    <span v-else>
      <span v-if="data.prim">
        <span v-if="isUpper(data.prim)">
          <span class="micheline-view-instr">{{ data.prim }}&nbsp;</span>
          <span v-if="data.annots">
            <span v-for="annot in data.annots" :key="annot.id">
              <span>{{ annot }}&nbsp;</span>
            </span>
          </span>
          <span v-if="data.args">
            <span v-for="(arg, i) in data.args" :key="arg.id">
              <MichelineViewItem :data="arg" :depth="depth" />
              <span v-if="i < data.args.length - 1">&nbsp;</span> 
            </span>
          </span>
        </span>
        <span v-else>
          <span v-if="data.args">
            <a href="#" class="micheline-view-type">{{ data.prim }}</a>
          </span>
          <span v-else>
            <span class="micheline-view-core-type">{{ data.prim }}</span>
            <span v-if="data.annots">
              <span v-for="annot in data.annots" :key="annot.id">
                <span>&nbsp;{{ annot }}</span>
              </span>
            </span>
          </span>
        </span>
        <!-- <span v-else>
          <span v-if="data.args">
            <span>(</span>
            <span class="micheline-view-type">{{ data.prim }}&nbsp;</span>
            <span v-if="data.annots">
              <span v-for="annot in data.annots" :key="annot.id">
                <span>{{ annot }}&nbsp;</span>
              </span>
            </span>
            <span v-for="(arg, i) in data.args" :key="arg.id">
              <MichelineViewItem :data="arg" :depth="depth"/>
              <span v-if="i < data.args.length - 1">&nbsp;</span> 
            </span>
            <span>)</span>
          </span>
          <span v-else>
            <span class="micheline-view-core-type">{{ data.prim }}</span>
            <span v-if="data.annots">
              <span v-for="annot in data.annots" :key="annot.id">
                <span>&nbsp;{{ annot }}</span>
              </span>
            </span>
          </span>
        </span> -->
      </span>
      <span v-else>
        <span class="micheline-view-value">{{ getValue(data) }}</span>
      </span>
    </span>
  </span>
</template>

<script>
import _ from "lodash";

export default {
  name: "MichelineViewItem",
  props: ["data", "depth"],
  methods: {
    isArray: function(value) {
      return _.isArray(value);
    },
    getValue: function(value) {
      let type = Object.keys(value)[0]
      if (type === "string") {
        return '"' + value[type] + '"';
      }
      return value[type];
    },
    isUpper: function(value) {
      return value === value.toUpperCase();
    },
    isSimple: function(value) {
      return value.every(function(x) {
        return _.isObject(x) && (x.args === undefined || x.args.every(function(y) {
          return y.args === undefined;
        }));
      });
    }
  }
};
</script>

<style scoped>

.micheline-view-item {
  font-size: 12px;
  font-family: "Roboto Mono", monospace;
}

.micheline-view-instr {
  color:navy;
}

.micheline-view-type {
  color:blueviolet;
  border-bottom: 1px solid blueviolet;
}

.micheline-view-type:hover {
  text-decoration: none;
  border-bottom: none;
}

.micheline-view-core-type {
  color:rgb(107, 161, 59);
}

.micheline-view-value {
  color:sienna;
}
</style>