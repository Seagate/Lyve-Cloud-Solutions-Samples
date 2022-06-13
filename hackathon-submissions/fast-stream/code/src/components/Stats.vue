<script setup lang="ts">
import axios from "axios";
</script>

<template>
  <div class="card my-1">
    <div class="card-content">
      <div class="content">
        <p class="title">Endpoint</p>
        <p>The URL to the S3 Storage: </p>
        <span v-cloak v-if="!emptyEndpoint" class="tag is-primary is-medium">
          {{ endpoint }}
        </span>
      </div>
    </div>
  </div>
  <div class="card my-1">
    <div class="card-content">
      <div class="content">
        <p class="title">Region</p>
        <p>The region of the S3 Storage: </p>
        <span v-cloak v-if="!emptyRegion" class="tag is-primary is-medium">
          {{ region }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  min-width: 100%;
}
</style>

<script lang="ts">
// Type declarations
interface Data {
  endpoint: string;
  region: string;
}

export default {
  data(): Data {
    return {
      endpoint: "",
      region: "",
    };
  },
  created(): void {
    // TODO
    axios
      .get(`${location.origin}/api/stats`)
      .then((res) => {
        this.endpoint = res.data.data.endpoint;
        this.region = res.data.data.region;
      })
      .catch((err) => {
        console.error(err);
      });
  },
  computed: {
    emptyEndpoint(): boolean {
      return this.endpoint === "";
    },
    emptyRegion(): boolean {
      return this.region === "";
    },
  },
};
</script>