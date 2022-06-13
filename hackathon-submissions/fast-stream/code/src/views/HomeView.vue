<script setup lang="ts"></script>

<template>
  <aside id="general-menu" class="menu py-2 px-3 m-0 has-background-white">
    <p class="menu-label">
      <img src="../assets/FS-logo.svg" alt="Fast-Stream logo" />
    </p>
    <p class="menu-label">Main Menu</p>
    <ul class="menu-list">
      <li><router-link to="/home/buckets">Buckets</router-link></li>
      <li><router-link to="/home/%20/media/1">Media</router-link></li>
      <li><router-link to="/home/viewer/%20/%20/media">Viewer</router-link></li>
    </ul>
  </aside>
  <div id="menu-interface" class="px-5 py-5 is-flex is-flex-direction-column is-justify-content-start is-align-items-center">
    <router-view></router-view>
  </div>
</template>

<style scoped>
#general-menu {
  width: 20%;
  z-index: 100;
  min-height: 100%;
  position: absolute;
}

#menu-interface {
  margin-left: 20%;
  min-height: 100%;
  max-height: 100%;
  overflow-y: auto;
}
</style>
