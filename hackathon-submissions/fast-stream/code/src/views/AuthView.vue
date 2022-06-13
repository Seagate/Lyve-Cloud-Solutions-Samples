<template>
  <div
    id="card-wrapper"
    class="is-flex is-justify-content-center is-align-items-center"
  >
    <div class="card">
      <div class="card-content">
        <div class="content">
          <div class="field">
            <p class="control">
              <img src="../assets/FS-logo.svg" alt="Fast-Stream logo" />
            </p>
          </div>
          <div class="field">
            <p class="control has-icons-left">
              <input class="input" type="text" placeholder="Username" />
              <span class="icon is-small is-left">
                <i class="material-icons">person</i>
              </span>
            </p>
          </div>
          <div class="field">
            <p class="control has-icons-left">
              <input class="input" type="password" placeholder="Password" />
              <span class="icon is-small is-left">
                <i class="material-icons">lock</i>
              </span>
            </p>
          </div>
          <div class="field">
            <p class="control">
              <button class="button is-primary is-fullwidth">Login</button>
            </p>
            <p class="control">
              <button
                class="button is-primary is-light is-fullwidth"
                @click="gotoHome()"
              >
                Enter as Guest
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
#app {
  height: 100vh;
}

#card-wrapper {
  height: 100vh;
}
</style>

<script lang="ts">
export default {
  methods: {
    gotoHome() {
      this.$router.push("/home");
    },
  },
};
</script>
