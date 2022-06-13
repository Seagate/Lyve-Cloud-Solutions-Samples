<script setup lang="ts">
import axios from "axios";
</script>

<template>
  <div v-if="hasPagination" id="input-top-wrapper" class="columns">
    <div class="column is-full">
      <div class="field box">
        <label class="label">Bucket</label>
        <div class="field has-addons">
          <div class="control">
            <input
              v-model="bucketName"
              @keyup.enter="updateBucket()"
              class="input"
              type="text"
              placeholder="Bucket Name"
            />
          </div>
          <div class="control">
            <a class="button is-info" @click="updateBucket()"> Search </a>
          </div>
        </div>
        <p class="help has-text-info">The bucket to retrieve media from</p>
      </div>
    </div>
  </div>
  <nav
    v-if="hasPagination"
    class="pagination is-centered"
    role="navigation"
    aria-label="pagination"
  >
    <a class="pagination-previous has-text-info">Previous</a>
    <a class="pagination-next has-text-info">Next page</a>
    <ul v-if="fullPageNav" class="pagination-list">
      <li v-for="page in pages" :key="idx">
        <a
          class="pagination-link"
          :class="{ 'is-current': isCurrent(page) }"
          :aria-label="gotoAria(page)"
          :aria-current="gotoAriaCurrent(page)"
          @click="gotoPage(page)"
          >{{ page }}</a
        >
      </li>
    </ul>
    <ul v-else-if="leftPageNav" class="pagination-list">
      <li v-for="page in 4" :key="idx">
        <a
          class="pagination-link"
          :class="{ 'is-current': isCurrent(page) }"
          :aria-label="gotoAria(page)"
          :aria-current="gotoAriaCurrent(page)"
          @click="gotoPage(page)"
          >{{ page }}</a
        >
      </li>
      <li>
        <span class="pagination-ellipsis">&hellip;</span>
      </li>
      <li>
        <a
          class="pagination-link"
          :aria-label="gotoAria(pages)"
          :aria-current="gotoAriaCurrent(pages)"
          @click="gotoPage(pages)"
          >{{ pages }}</a
        >
      </li>
    </ul>
    <ul v-else-if="rightPageNav" class="pagination-list">
      <li>
        <a class="pagination-link" aria-label="Goto page 1" @click="gotoPage(1)"
          >1</a
        >
      </li>
      <li>
        <span class="pagination-ellipsis">&hellip;</span>
      </li>
      <li v-for="page in 4" :key="idx">
        <a
          class="pagination-link"
          :class="{ 'is-current': isCurrent(page + pages - 4) }"
          :aria-label="gotoAria(page + pages - 4)"
          :aria-current="gotoAriaCurrent(page + pages - 4)"
          @click="gotoPage(page + pages - 4)"
          >{{ page + pages - 4 }}</a
        >
      </li>
    </ul>
    <ul v-else-if="centerPageNav" class="pagination-list">
      <li>
        <a class="pagination-link" aria-label="Goto page 1">1</a>
      </li>
      <li>
        <span class="pagination-ellipsis">&hellip;</span>
      </li>
      <li>
        <a
          class="pagination-link"
          :aria-label="gotoAria(currentPage - 1)"
          :aria-current="gotoAriaCurrent(currentPage - 1)"
          @click="gotoPage(currentPage - 1)"
          >{{ currentPage - 1 }}</a
        >
      </li>
      <li>
        <a
          class="pagination-link"
          :class="{ 'is-current': isCurrent(currentPage) }"
          :aria-label="gotoAria(currentPage)"
          :aria-current="gotoAriaCurrent(currentPage)"
          @click="gotoPage(currentPage)"
          >{{ currentPage }}</a
        >
      </li>
      <li>
        <a
          class="pagination-link"
          :aria-label="gotoAria(currentPage + 1)"
          :aria-current="gotoAriaCurrent(currentPage + 1)"
          @click="gotoPage(currentPage + 1)"
          >{{ currentPage + 1 }}</a
        >
      </li>
      <li>
        <span class="pagination-ellipsis">&hellip;</span>
      </li>
      <li>
        <a
          class="pagination-link"
          :aria-label="gotoAria(pages)"
          :aria-current="gotoAriaCurrent(pages)"
          @click="gotoPage(pages)"
          >{{ pages }}</a
        >
      </li>
    </ul>
  </nav>
  <div v-for="item in items" class="columns display-wrapper">
    <div class="column is-full">
      <div
        v-if="hasPagination" 
        class="is-flex is-justify-content-space-between is-align-items-center has-background-white px-2 py-3 display-wrapper"
      >
        <div>
          <h1 class="title">{{ item.Key }}</h1>
          <h2 class="subtitle">Size: {{ item.Size }} Bytes</h2>
        </div>
        <div>
          <button
            class="button is-info"
            @click="copyAPI('media', item.Key)"
          >
            <span class="icon is-small">
              <i class="material-icons">content_copy</i>
            </span>
          </button>
          <button class="button is-primary" @click="gotoMedia(item.Key)">
            <span class="icon is-small">
              <i class="material-icons">start</i>
            </span>
          </button>
        </div>
      </div>
      <div
        v-else
        class="is-flex is-justify-content-space-between is-align-items-center has-background-white px-2 py-3 display-wrapper"
      >
        <div>
          <h1 class="title">{{ item.Name }}</h1>
          <h2 class="subtitle">Created On: {{ new Date(item.CreationDate) }}</h2>
        </div>
        <div>
          <button
            class="button is-info"
            @click="copyAPI('bucket', item.Name)"
          >
            <span class="icon is-small">
              <i class="material-icons">content_copy</i>
            </span>
          </button>
          <button
            class="button is-primary"
            @click="gotoBucket(item.Name)"
          >
            <span class="icon is-small">
              <i class="material-icons">start</i>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.display-wrapper {
  min-width: 100%;
  border-radius: 10px;
}

#input-top-wrapper {
  min-width: 100%;
}
</style>

<script lang="ts">
// Type declaration
interface Data {
  currentPage: number;
  fullPageNav: boolean;
  leftPageNav: boolean;
  rightPageNav: boolean;
  centerPageNav: boolean;
  items: any[];
  pages: number;
  hasPagination: boolean;
  bucketName: string | null;
}

export default {
  props: {
    target: String,
  },
  data(): Data {
    return {
      currentPage: 1,
      fullPageNav: false,
      leftPageNav: false,
      rightPageNav: false,
      centerPageNav: false,
      items: [],
      pages: 0,
      hasPagination: false, 
      bucketName: "",
    };
  },
  created(): void {
    if (this.target === "bucket") {
      // TODO
      axios
        .get(`${location.origin}/api/hard/buckets`)
        .then((res) => {
          this.items = res.data.data;
        })
        .catch((err) => {
          console.error(err);
        });
    } else if (this.target === "media") {
      this.hasPagination = true;
      this.currentPage = parseInt(this.$route.params.page);
      this.bucketName = this.$route.params.bucketName;

// TODO
      axios
        .get(`${location.origin}/api/hard/bucket/${encodeURI(this.bucketName)}/media`, {
          params: { page: this.currentPage, limit: 10 },
        })
        .then((res) => {
          this.items = res.data.data.media;
          this.pages = res.data.data.pages;

          if (this.pages <= 5) {
            this.fullPageNav = true;
          } else if (this.currentPage === 1) {
            this.leftPageNav = true;
          } else if (this.currentPage === this.pages) {
            this.rightPageNav = true;
          } else {
            this.centerPageNav = true;
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
  },
  methods: {
    gotoPage(pageNumber: number): void {
      if (this.hasPagination) {
        this.$router.push(`/home/${encodeURI(this.bucketName)}/media/${pageNumber}`).then(() => {this.$router.go();});
      }
    },
    updateBucket(): void {
      if (this.hasPagination) {
        this.$router.push(`/home/${encodeURI(this.bucketName)}/media/1`).then(() => {this.$router.go();});
      }
    },
    copyAPI(type: string, itemName: string): void {
      if (type === "media") {
        // `http://localhost:5000/api/hard/bucket/${encodeURI( TODO
        navigator.clipboard.writeText(
          `${location.origin}/api/hard/bucket/${encodeURI( 
            this.bucketName
          )}/media/${encodeURI(itemName)}`
        );
      } else if (type === "bucket") {
        // `http://localhost:5000/api/hard/bucket/${encodeURI(itemName)}` TODO
        navigator.clipboard.writeText(
          `${location.origin}/api/hard/bucket/${encodeURI(itemName)}`
        );
      }
    },
    gotoBucket(name: string): void {
      this.$router.push(`/home/${encodeURI(name)}/media/1`);
    }, 
    gotoMedia(name: string): void {
      this.$router.push(`/home/viewer/${encodeURI(this.bucketName)}/${encodeURI(name)}/media`);
    }, 
    isCurrent(pageNumber: number): boolean {
      return this.currentPage === pageNumber;
    },
    gotoAria(pageNumber: number): string {
      return `Go to page ${pageNumber}`;
    },
    gotoAriaCurrent(pageNumber: number): string {
      if (this.currentPage === pageNumber) {
        return "page";
      }

      return "";
    }
  }
};
</script>