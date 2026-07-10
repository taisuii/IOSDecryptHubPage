<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main>
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">Static demo · GitHub Pages</div>
        <h1>解密流程，一目了然</h1>
        <p>
          这是一个用 Vue 3 + Vite 构建的静态演示站，展示如何把前端项目发布到
          GitHub Pages。无需后端，推送即可上线。
        </p>
        <div class="cta-row">
          <RouterLink class="btn btn-primary" to="/demo">打开交互演示</RouterLink>
          <a
            class="btn btn-ghost"
            href="https://github.com/taisuii/IOSDecryptHubPage"
            target="_blank"
            rel="noreferrer"
          >
            查看源码
          </a>
        </div>
      </div>

      <div class="panel terminal">
        <div class="terminal-bar">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="terminal-title">decrypt-hub — session</span>
        </div>
        <div class="terminal-body">
          <div class="muted">$ npm run build</div>
          <div>vite v8 · building for production...</div>
          <div class="ok">✓ built in 1.2s</div>
          <div class="muted">$ actions: deploy → pages</div>
          <div class="ok">✓ live at ios.decrypthub.com</div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>这个 Demo 包含什么</h2>
      <p>最小可用的 Vue 站点结构，方便你对照文档自己改内容和样式。</p>
      <div class="feature-grid">
        <article class="feature">
          <div class="feature-index">01</div>
          <h3>Hash 路由</h3>
          <p>使用 createWebHashHistory，刷新子页面不会在 GitHub Pages 上 404。</p>
        </article>
        <article class="feature">
          <div class="feature-index">02</div>
          <h3>正确的 base</h3>
          <p>vite.config.js 中 base 设为仓库名，资源路径与站点路径一致。</p>
        </article>
        <article class="feature">
          <div class="feature-index">03</div>
          <h3>Actions 自动发布</h3>
          <p>推送到 main 后自动构建 dist，并部署到 GitHub Pages。</p>
        </article>
      </div>
    </section>
  </main>
</template>
