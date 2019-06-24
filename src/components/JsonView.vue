<template>
  <TreeView :data="data" :root="root" max-depth="7"/>
</template>

<script>
import TreeView from "./TreeView.vue";

export default {
  name: "JsonView",
  components: {
    TreeView
  },
  props: ["data", "root"]
};
</script>
