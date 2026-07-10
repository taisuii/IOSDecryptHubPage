<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="page-shell">
    <header class="site-header">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">iD</span>
        <span>iOS Decrypt Hub</span>
      </RouterLink>
      <nav class="nav-links">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/demo">演示</RouterLink>
      </nav>
    </header>

    <RouterView />

    <footer class="site-footer">
      <span>iOS Decrypt Hub · Vue + Vite Demo</span>
      <span>Hosted on GitHub Pages</span>
    </footer>
  </div>
</template>
