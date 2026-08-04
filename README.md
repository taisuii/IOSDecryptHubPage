# IOSDecryptHub · 官网

IOSDecryptHub 的官方网站——一个基于 fishhook 的
iOS App 运行时加解密审计平台。本站为交互式作品级站点，Vite + Three.js 构建。

## 页面结构

- **首页 `/`**：3D 主视觉（Three.js 解密核心 + 扫描环）、直接下载 DYLIB、实时面板复刻、能力速览。
- **文档 `/docs.html`**：安装与注入（TrollFools / IPA 重打包 / 越狱插件源 / idh 网关）、能力全景、算法覆盖矩阵、砸壳流水线、MCP · Capstone 36 工具。
- **动态 `/news.html`**：技术文章（markdown 渲染 + hash 路由），文章数据在 `src/news-data.js`，发布新文章时在数组末尾追加一条。

## 呈现内容

- **3D 主视觉**：Three.js 解密核心（wireframe 二十面体 + 粒子场 + 扫描环），鼠标视差。
- **首页直接下载 DYLIB**：TrollStore 注入器选目标 App 即可注入。
- **实时捕获流**：模拟 App 调用加密 API 的结构化事件流 + master-detail 详情。
- **交互式 Web 面板复刻**：加解密 / 文件 / 系统 / 符号 / Dump 五 tab 可切换。
- **算法覆盖矩阵**：摘要 / HMAC / 对称 / OpenSSL EVP / 非对称 / KDF（文档页）。
- **砸壳流水线**：FairPlay 内存脱壳四步可视化（文档页）。
- **MCP · Capstone 工具集**：36 个工具（11 个反汇编 / xref + 取证 / 沙盒 / 控制）的 JSON-RPC 交互演示（文档页）。
- **fail-loud 健康监控**。

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build   # 产物在 dist/
```

## 发布

新版本发布时，先同步 dylib 到官网静态目录并更新首页下载元数据：

```bash
./scripts/sync_dylib.sh                 # 自动选择 ../IOSDecryptHub 下最新的版本
./scripts/sync_dylib.sh ../IOSDecryptHub/decrypt_helper-1.23.8.dylib
```

脚本会把 dylib 复制到 `public/dylibs/`，并刷新 `src/data.js` 里的版本、大小与 SHA-256。
之后执行 `npm run build` 并推送 `main`，GitHub Actions 会自动部署。

## 技术栈

- Vite 5
- Three.js（Hero 3D 场景）
- 原生 JS 模块 + 手写设计系统 CSS，无 UI 框架依赖

## 在线地址

https://ios.decrypthub.com/
