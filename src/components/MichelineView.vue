<template>
  <span class="micheline-view-item">
    <span v-if="isArray(data)">
      <span>{&nbsp;</span>
      <span v-if="isSimple(data)">
        <span v-for="(arg, i) in data" :key="arg.id">
          <MichelineViewItem :data="arg" :depth="depth + 1" :path="path+'-'+i"/>
          <span v-if="i < data.length - 1">;&nbsp;</span>
        </span>
      </span>
      <span v-else>
        <br>
        <span v-for="(arg, i) in data" :key="arg.id">
          <span v-for="j in Array(depth)" :key="j">&nbsp;&nbsp;</span>
          <MichelineViewItem :data="arg" :depth="depth + 1" :path="path+'-'+i"/>
          <span v-if="i < data.length - 1">
            ;
            <br>
          </span>
        </span>
        <br>
        <span v-for="j in Array(depth - 1)" :key="j">&nbsp;&nbsp;</span>
      </span>
      <span>}&nbsp;</span>
    </span>
    <span v-else>
      <span v-if="data.prim">
        <span v-if="!isType(data.prim)">

          <span class="micheline-view-instr">{{ data.prim }}&nbsp;</span>
          <span v-if="data.annots">
            <span v-for="annot in data.annots" :key="annot.id">
              <span>{{ annot }}&nbsp;</span>
            </span>
          </span>

          <span v-if="isIf(data.prim)">
            <MichelineViewItem :data="data.args[0]" :depth="depth" :path="path+'-0'"/>
            <br>
            <span v-for="j in Array(depth - 1)" :key="j">&nbsp;&nbsp;</span>
            <span>$ELSE&nbsp;</span>
            <MichelineViewItem :data="data.args[1]" :depth="depth" :path="path+'-1'"/>
          </span>
          <span v-else-if="isPush(data.prim)">
            <span><MichelineViewItem :data="data.args[0]" :depth="depth" :path="path+'-0'"/></span>
            <span class="micheline-view-value">&nbsp;{{ decodeTypedData(data.args[0], data.args[1]) }}</span>
          </span>
          <span v-else>
            <span v-if="data.args">
              <span v-for="(arg, i) in data.args" :key="arg.id">
                <MichelineViewItem :data="arg" :depth="depth" :path="path+'-'+i"/>
                <span v-if="i < data.args.length - 1">&nbsp;</span>
              </span>
            </span>
          </span>
        </span>
        <span v-else>
          <span v-if="data.args" class="micheline-popover">
            <button :id="path" class="micheline-view-type">{{ getType(data) }}</button>
            <b-popover :target="path" triggers="focus" placement="bottomright">
              <JsonView :data="decodeType(data)"/>
            </b-popover>
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

        <!-- 
          -- need to decode value using the scheme
          PUSH 'a x

          -- handled
          CREATE_CONTRACT { storage 'g ; parameter 'p ; code ... }
          LAMBDA 'a 'b code
          EMPTY_MAP 'key 'val
          EMPTY_SET 'elt
          NONE 'a
          LEFT 'b
          RIGHT 'a
          NIL 'a
          CONTRACT 'p
          UNPACK 'a
        -->
      </span>
      <span v-else>
        <span class="micheline-view-value">{{ getValue(data) }}</span>
      </span>
    </span>
  </span>
</template>

<script>
import _ from "lodash";
import { decodeSchema, buildSchema, decodeData } from "@/app/decode";

export default {
  name: "MichelineViewItem",
  props: ["data", "depth", "path"],
  components: {
    JsonView: () => import("./JsonView.vue")
  },
  methods: {
    isArray: function(value) {
      return _.isArray(value);
    },
    getValue: function(value) {
      let type = Object.keys(value)[0];
      if (type === "string") {
        return '"' + value[type] + '"';
      }
      return value[type];
    },
    isType: function(value) {
      return value === value.toLowerCase() && value !== "code";
    },
    getType: function(value) {
      if (value.annots) {
        return value.annots[0];
      } else {
        return value.prim;
      }
    },
    isIf: function(value) {
      return ["IF", "IF_NONE", "IF_LEFT", "IF_RIGHT", "IF_CONS"].includes(value);
    },
    isPush: function(value) {
      return value === "PUSH";
    },
    isSimple: function(value) {
      if (value.length < 6) {
        return value.every(function(x) {
          return !["IF", "IF_NONE", "IF_LEFT", "IF_RIGHT", "IF_CONS", "ITER"].includes(x.prim);
        });
      } else if (value.length < 10) {
        return value.every(function(x) {
          return !_.isArray(x) && x.args === undefined;
        });
      } else {
        return value.every(function(x) {
          return !_.isArray(x) && x.args === undefined && x.annots === undefined;
        });
      }
    },
    decodeType(data) {
      let schema = buildSchema(data);
      return decodeSchema(schema.collapsed_tree);
    },
    decodeTypedData(schema, data) {
      let typeSchema = buildSchema(schema);
      return decodeData(data, typeSchema);
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
  color: navy;
}

.micheline-view-type {
  border: none;
  text-decoration: underline;
  padding: 0;
  margin: 0;
  color: blueviolet;
  cursor: pointer;
  background-color: transparent;
}

.micheline-view-type:hover {
  text-decoration: none;
}

.micheline-view-type:focus {
  box-shadow: none;
  outline: none;
}

.micheline-view-core-type {
  color: rgb(107, 161, 59);
}

.micheline-view-value {
  color: sienna;
}
</style>

<style>
.popover-body > div > div > div {
  margin-left: 0px !important;
}
</style>
