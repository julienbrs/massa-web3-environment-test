<script setup lang="ts">
import MassaWeb3Test from "./components/Web3Test.vue";

</script>

<template>
  <div>
    <a target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <MassaWeb3Test />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
