<template>
  <div id="input-wrapper" class="columns">
    <div class="column is-full box">
      <div class="field">
        <label class="label">Bucket</label>
        <div class="control">
          <input
            v-model="bucketName"
            class="input"
            type="text"
            placeholder="Bucket Name"
            @keyup.enter="updateMedia()"
          />
        </div>
        <p class="help has-text-info">The bucket to retrieve media from</p>
      </div>
      <div class="field">
        <label class="label">Media</label>
        <div class="control">
          <input
            v-model="mediaName"
            class="input"
            type="text"
            placeholder="Media Name"
            @keyup.enter="updateMedia()"
          />
        </div>
        <p class="help has-text-info">The media to retrieve</p>
      </div>
      <div class="field">
        <div class="control">
          <a class="button is-info" @click="updateMedia()"> Search </a>
        </div>
      </div>
    </div>
  </div>
  <div v-if="isImage" class="box">
    <img :src="mediaLink" :alt="mediaName" />
  </div>
  <div v-else-if="isVideo" class="box">
    <video muted="muted" controls>
      <source :src="mediaLink" :type="mediaType" />
      <p class="has-text-warning">This browser does not support the HTML <code>video</code> element.</p>
    </video>
  </div>
  <div v-else-if="isAudio" class="box">
    <audio controls>
      <source :src="mediaLink" :type="mediaType" />
      <p class="has-text-warning">This browser does not support the HTML <code>audio</code> element.</p>
    </audio>
  </div>
  <div v-else class="box">
    <div>
      <div class="content has-text-danger">Media could not be retrieved.</div>
    </div>
  </div>
</template>

<style scoped>
#input-wrapper {
  min-width: 100%;
}
</style>

<script lang="ts">
export default {
  data() {
    return {
      mediaName: "",
      bucketName: "",
      isAudio: false,
      isImage: false,
      isVideo: false,
      mediaLink: "",
      mediaType: "",
    };
  },
  created(): void {
    this.mediaName = this.$route.params.mediaName;
    this.bucketName = this.$route.params.bucketName;

    let extIdx = this.mediaName.lastIndexOf(".");
    let ext = this.mediaName.substring(extIdx + 1);

    if (ext === "") {
      return;
    }

    const imageList = [
      ["apng", "image/apng"],
      ["avif", "image/avif"],
      ["gif", "image/gif"],
      ["jpg", "image/jpeg"],
      ["jpeg", "image/jpeg"],
      ["jfif", "image/jpeg"],
      ["pjpeg", "image/jpeg"],
      ["pjp", "image/jpeg"],
      ["png", "image/png"],
      ["svg", "image/svg"],
      ["webp", "image/webp"],
      ["bmp", "image/bmp"],
      ["ico", "image/x-icon"],
      ["cur", "image/x-icon"],
      ["tif", "image/tiff"],
      ["tiff", "image/tiff"],
    ];

    const videoList = [
      ["3gp", "video/3gpp"],
      ["3g2", "video/3gpp2"],
      ["mpg", "video/mpeg"],
      ["mpeg", "video/mpeg"],
      ["m1v", "video/mpeg"],
      ["mpv", "video/mpeg"],
      ["mp4", "video/mp4"],
      ["ogg", "video/ogg"],
      ["ogv", "video/ogg"],
      ["mov", "video/quicktime"],
      ["webm", "video/webm"],
    ];

    const audioList = [
      ["aac", "audio/aac"],
      ["flac", "audio/flac"],
      ["mp1", "audio/mpeg"],
      ["mp2", "audio/mpeg"],
      ["mp3", "audio/mpeg"],
      ["m1a", "audio/mpeg"],
      ["m2a", "audio/mpeg"],
      ["mpa", "audio/mpeg"],
      ["wav", "audio/wave"],
    ];

    const imageMap = new Map();
    const videoMap = new Map();
    const audioMap = new Map();

    for (let elem of imageList) {
      imageMap.set(elem[0], elem[1]);
    }

    for (let elem of videoList) {
      videoMap.set(elem[0], elem[1]);
    }

    for (let elem of audioList) {
      audioMap.set(elem[0], elem[1]);
    }

    if (imageMap.get(ext) !== undefined) {
      this.isImage = true;
      // this.mediaLink = `http://localhost:5000/api/hard/bucket/${encodeURI( TODO
      this.mediaLink = `${location.origin}/api/hard/bucket/${encodeURI( 
        this.bucketName
      )}/media/${encodeURI(this.mediaName)}`;
    } else if (videoMap.get(ext) !== undefined) {
      this.isVideo = true;
      // this.mediaLink = `http://localhost:5000/api/hard/bucket/${encodeURI( TODO
      this.mediaLink = `${location.origin}/api/hard/bucket/${encodeURI(
        this.bucketName
      )}/media/${encodeURI(this.mediaName)}`;
      this.mediaType = videoMap.get(ext);
    } else if (audioMap.get(ext) !== undefined) {
      this.isAudio = true;
      // this.mediaLink = `http://localhost:5000/api/hard/bucket/${encodeURI( TODO
      this.mediaLink = `${location.origin}/api/hard/bucket/${encodeURI(
        this.bucketName
      )}/media/${encodeURI(this.mediaName)}`;
      this.mediaType = audioMap.get(ext);
    }
  }, 
  methods: {
    updateMedia(): void {
      this.$router.push(`/home/viewer/${encodeURI(this.bucketName)}/${encodeURI(this.mediaName)}/media`).then(() => {this.$router.go();});
    }
  }
};
</script>