import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import AuthView from "../views/AuthView.vue";
import NestedStatsView from "../views/NestedStatsView.vue";
import NestedBucketView from "../views/NestedBucketView.vue";
import NestedMediaView from "../views/NestedMediaView.vue";
import NestedViewerView from "../views/NestedViewerView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "auth",
      component: AuthView,
    },
    {
      path: "/home",
      name: "home",
      component: HomeView,
      children: [
        {
          path: "",
          component: NestedStatsView,
        },
        {
          path: "buckets",
          component: NestedBucketView,
        },
        {
          path: ":bucketName/media/:page",
          component: NestedMediaView,
        },
        {
          path: "viewer/:bucketName/:mediaName/media",
          component: NestedViewerView,
        },
      ],
    },
  ],
});

export default router;