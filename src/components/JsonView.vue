<template>
  <TreeView :data="data" max-depth="7"/>
</template>

<script>
import TreeView from "./TreeView.vue";

export default {
  name: "JsonView",
  components: {
    TreeView
  },
  props: {
    data: Object
  }
};
</script>
