<template>
  <div v-cloak id="video-box">
    <label for="bucket-name">
      Bucket:
      <input id="bucket-name" v-model="bucketName" />
    </label>
    <label for="media-name">
      Media:
      <input id="media-name" v-model="mediaName" />
      <button @click="createVideo()">Show</button>
    </label>
    <br />
    <video v-if="showVideo" id="video-element" muted="muted" controls>
      <source :src="videoSrc" type="video/mp4" />
    </video>
  </div>
</template>

<style scoped>
#video-box {
  display: flex;
  justify-content: center;
  align-items: top;
  margin-top: 20%;
}

#video-element {
  width: 300%;
  height: 40%;
}
</style>

<script lang="ts">
export default {
  data() {
    return {
      bucketName: "",
      mediaName: "",
      showVideo: false,
    };
  },
  methods: {
    createVideo() {
      this.showVideo = true;
    },
  },
  computed: {
    videoSrc() {
      return `http://localhost:5000/api/hard/bucket/${this.bucketName}/media/${this.mediaName}`;
    },
  },
};
</script>