// 技术文章（news）数据源。
// 新增文章：复制一个对象追加到数组即可，slug 需唯一。
// content 为 markdown 文本，由 src/markdown.js 渲染。

export const NEWS_ARTICLES = [
  {
    slug: 'udp-beacon-vs-bonjour',
    title: '为什么发现层用 UDP 信标，而不是 Bonjour',
    date: '2026-07-25',
    tags: ['架构', '发现协议'],
    summary: '注入场景下宿主 App 的 Info.plist 不一定声明 NSBonjourServices，Bonjour 注册会静默失败。我们选择 UDP 广播信标承载设备发现。',
    content: `注入式工具的设备发现，通常有两条路：mDNS/Bonjour 或自研信标。

## Bonjour 的问题

Bonjour 注册依赖宿主 App 的 \`Info.plist\` 声明 \`NSBonjourServices\`。但 dylib 是注入到**别人的 App** 里，你无法控制它的 Info.plist：

- 声明缺失 → 注册**静默失败**，没有错误也没有日志；
- 注入器（如 TrollFools）不一定帮你合并这两个键；
- 越狱场景想覆盖所有宿主 App 更不现实。

## UDP 信标的取舍

我们最终选择了 UDP 广播信标（端口 8089）：

- 不需要任何 plist 声明，注入即可用；
- 广播包里带上 HTTP 端口（8088）、设备名、版本号；
- PC 端 \`idh\` 监听广播即可发现设备，无需手动输入 IP。

代价是同一局域网内的无关设备也会收到广播——但作为调试工具，这完全可接受。

## 结论

> 在无法控制宿主环境的注入场景里，越简单的协议越可靠。`
  },
  {
    slug: 'mcp-reuses-8088',
    title: 'MCP 为什么复用 8088，而不是单独开端口',
    date: '2026-07-18',
    tags: ['架构', 'MCP'],
    summary: '注入场景里每多开一个监听端口，就多一分被 App 检测到的风险。MCP Streamable HTTP 复用内嵌 HTTP 服务，不再额外占端口。',
    content: `注入 dylib 需要对外提供三类能力：Web 面板、MCP 服务、设备发现。端口策略直接影响在目标进程内的暴露面。

## 多端口的问题

每个新监听端口：

- 多一条可被宿主 App 枚举的 \`lsof\` / \`netstat\` 痕迹；
- 多一份被安全 SDK 检测到的风险（比如某些反调试 SDK 会扫描监听端口）；
- 多一套 CORS、认证、TLS 配置要维护。

## 一个端口承载全部

MCP 的 Streamable HTTP 传输（\`POST /api/mcp\`）复用 dylib 内嵌的 HTTP 服务，与 Web 面板共享 8088 端口：

- \`GET /\` → Web 面板
- \`POST /api/mcp\` → MCP JSON-RPC
- UDP 8089 → 仅负责广播存在，不提供业务数据

idh 网关也基于此设计：把 HTTP MCP 桥接成 stdio MCP，供 Codex、Claude 等客户端直接使用。

## 结论

> 注入场景下，暴露面越小越好。能力合并到一个端口，既满足功能，也降低被检测概率。`
  },
  {
    slug: 'why-not-inline-hook',
    title: 'fishhook 的边界：为什么不用 inline hook',
    date: '2026-07-10',
    tags: ['技术', 'hook'],
    summary: '非越狱环境拿不到 dynamic-codesigning entitlement，内核拒绝任何可执行内存分配。inline hook 在物理上不可能，只能改指针。',
    content: `做运行时 hook，第一反应往往是 inline hook（改写函数头几条指令跳到 trampoline）。但在这个项目里，这条路从一开始就不存在。

## 物理限制

免越狱侧载的 App 拿不到 \`dynamic-codesigning\` entitlement，内核**拒绝任何可执行内存分配**：

- 无法写入可执行的 trampoline 代码页；
- 无法在目标函数开头改写指令；
- QBDI、Frida Stalker 这类 DBI 同样依赖可执行内存，直接出局。

## 能做什么

只能改指针，不能改指令：

- **fishhook**：改写 Mach-O 的 GOT / lazy symbol 指针，拦截 C 函数；
- **ObjC swizzle**：交换 method IMP，拦截 ObjC 方法。

## 这样够用吗

够。常见加解密 API（CommonCrypto、SecKey、OpenSSL EVP）和系统调用（open/write/dlopen/dlsym）都是符号级入口，fishhook 全覆盖；再叠一层 \`dlsym\` 重定向，堵住函数指针旁路。

> 越狱环境有 RWX 权限，但我们仍统一使用 fishhook + swizzle——双轨共享同一份核心引擎，行为永远一致。`
  },
  {
    slug: 'two-injection-routes',
    title: '免越狱注入的两种路线：TrollStore 与 IPA 重打包',
    date: '2026-06-30',
    tags: ['入门', '注入'],
    summary: 'TrollFools 直接注入目标 App，或重打包成 IPA 再安装。两种方式共享同一份 dylib，只有注入载体不同。',
    content: `拿到 \`decrypt_helper.dylib\` 之后，怎么把它送进目标 App？两条主流路线：

## 路线一 · TrollFools 注入（推荐）

设备已装 TrollStore 时：

1. 打开巨魔注入器，选择目标 App；
2. 添加 \`decrypt_helper.dylib\` 执行注入；
3. 重新启动目标 App。

注入器会帮你 patch Mach-O，整个过程在设备上完成，不需要电脑。

## 路线二 · IPA 重打包

macOS 上操作：

\`\`\`bash
brew install insert_dylib
./scripts/inject.sh <input.ipa> decrypt_helper.dylib
\`\`\`

生成 \`hooked_<input>.ipa\` 后，用 TrollStore、Sideloadly 或 AltStore 安装 / 重签即可。

## 注入后

启动目标 App，同一局域网浏览器访问 \`http://<设备 IP>:8088\` 打开面板；或安装 \`idh\` 自动发现设备：

\`\`\`bash
pip install ios-decrypt-hub
idh --devices
idh mcp
\`\`\`

> 两种方式注入的是同一份 dylib 核心引擎，后续行为完全一致。`
  },
];
