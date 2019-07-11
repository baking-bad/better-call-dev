<template>
  <b-container>
    <b-row>
      <b-col lg="12" class="text-center mt-5">
        <img
          width="200"
          src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/bff6e823957341.5632ba903c8fd.jpg"
        />
        <p class="mt-3">The page you requested was not found. 404.</p>
        <router-link to="/" tag="button" class="btn btn-success btn-sm">Better call dev</router-link>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  name: "404"
};
</script>

<style>
</style>
