<template>
  <b-col lg="12" class="mb-3 text-center" v-if="status">
    <img
      width="300"
      src="https://i.pinimg.com/originals/ed/a4/d6/eda4d64864873b5ee6ef4abe1700cf50.jpg"
    >
    <br>
    <span>
      Picture by
      <a href="https://www.behance.net/gallery/23957341/href" target="_blank">
        Guillermo
        Prestegui
      </a>.
    </span>
  </b-col>
</template>

<script>
export default {
  name: "NotFound",
  props: {
    status: Boolean
  }
};
</script>

<style scoped>
</style>
