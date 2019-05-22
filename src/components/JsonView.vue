<template>
  <print-object :printable-object="data"></print-object>
</template>

<script>
import PrintObject from "vue-print-object";
import "vue-print-object/dist/vue-print-object.css";

export default {
  name: "JsonView",
  components: {
    PrintObject
  },
  props: {
    data: Object
  }
};
</script>
