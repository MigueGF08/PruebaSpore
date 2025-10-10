<template>
  <router-view />
</template>

<script setup>
// No necesitas importar los componentes aquí, el router los maneja
</script>

<style scoped>
@reference "tailwindcss";

.logo {
  @apply h-24 p-6 transition-all duration-300;
}
.logo:hover {
  @apply drop-shadow-lg;
}
.logo.vue:hover {
  @apply text-green-500;
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
