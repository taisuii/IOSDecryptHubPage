// Minimal i18n: dictionary + language switch, persisted in localStorage.
// Default: zh. Static text uses [data-i18n="key"]; JS-rendered text uses t(key).

const LS_KEY = 'idh-lang';

export const DICT = {
  zh: {
    'nav.home': '首页',
    'nav.docs': '文档',
    'nav.news': '动态',
    'lang.switch': 'EN',
    'lang.label': 'English',

    'hero.title2': '看见运行时的真相',
    'hero.sub': '设备安装运行时插件，电脑安装 idh。连接同一可信局域网，即可发现 App 并开始分析。',
    'hero.dl.meta': 'iOS 14.0+ · arm64 · TrollStore 注入器',
    'hero.dl.title': '下载 dylib v1.23.8',
    'hero.src.meta': 'iOS 14.0+ · rootless / roothide',
    'hero.src.title': '添加插件源',
    'hero.idh.meta': 'macOS / Linux · Python 3.10+',
    'hero.idh.title': '安装 idh',
    'hero.guide': '可用 TrollFools 直接注入，或重打包 IPA 后使用。',
    'hero.trust': 'HTTP / MCP 服务不设认证，仅限授权测试与可信局域网；请勿将 8088 端口暴露到公网。',
    'hero.scroll': '向下滚动',

    'home.panel.kicker': '实时面板',
    'home.panel.title': '插件里的运行时控制台，直接在这里操作',
    'home.panel.lead': '界面与插件内置页面保持一致。切换页签、筛选与搜索测试 IPA 产生的日志，点任意记录查看 Key、IV、输入输出、HexDump 与调用栈。',

    'docs.kicker': 'DOCS · 文档',
    'docs.title': '使用文档',
    'docs.subtitle': '从注入到分析：安装方式、能力全景、算法覆盖与 MCP 工具说明。',
    'docs.toc.start': '快速开始',
    'docs.toc.install': '安装与注入',
    'docs.toc.caps': '能力全景',
    'docs.toc.algo': '算法覆盖',
    'docs.toc.mcp': 'MCP 工具',
    'docs.toc.security': '安全与合规',
    'docs.start.h2': '快速开始',
    'docs.start.step1t': '下载 dylib',
    'docs.start.step1d': '从官网首页或 GitHub Releases 下载 decrypt_helper.dylib。',
    'docs.start.step2t': '注入目标 App',
    'docs.start.step2d': '用 TrollFools 直接注入，或安装越狱插件后选择目标 App。',
    'docs.start.step3t': '打开面板',
    'docs.start.step3d': '启动目标 App，在同一局域网的浏览器访问 http://<设备 IP>:8088。',
    'docs.start.note': '仅限自有 App 或已获授权的安全测试与研究。',
    'docs.install.h2': '安装与注入',
    'docs.install.tf.h3': '方式一 · TrollFools 巨魔注入（推荐）',
    'docs.install.tf.p1': '适用于已通过 TrollStore 安装巨魔注入器的设备：',
    'docs.install.tf.s1': '在巨魔注入器中选择目标 App。',
    'docs.install.tf.s2': '添加 decrypt_helper.dylib 并执行注入。',
    'docs.install.tf.s3': '启动目标 App。',
    'docs.install.tf.s4': '在同一局域网的浏览器访问 http://<设备 IP>:8088。',
    'docs.install.tf.p2': '不同注入器的界面可能略有差异，核心操作都是将 dylib 注入目标 App 后重新启动 App。',
    'docs.install.src.h3': '方式二 · 越狱插件源',
    'docs.install.src.p1': '在包管理器（Sileo / Zebra）中添加插件源 https://ios.decrypthub.com/，安装 com.iosdecrypthub，然后在「设置 → IOSDecryptHub」中选择要注入的 App。支持 rootless / roothide 双端。',
    'docs.install.idh.h3': 'PC 端 · idh 网关',
    'docs.install.idh.p1': '插件通过 UDP 信标广播自身地址。安装 idh 后无需手动输入设备 IP：',
    'docs.install.idh.p2': 'idh mcp 把设备上的 HTTP MCP 转换为本机 stdio MCP，可直接作为 Codex、Claude 等 AI 客户端的固定 MCP 配置。',
    'docs.install.note': '使用第三方注入器时，需要由宿主 App 或注入器提供 NSLocalNetworkUsageDescription 与 NSBonjourServices 两个 Info.plist 声明。',
    'docs.caps.h2': '能力全景',
    'docs.caps.lead': '同一条运行时链路，六种观察视角。拦截的是 CommonCrypto、Security.framework、OpenSSL EVP 三套系统库，以及沙盒文件与动态库加载。同名接口在 macOS 与 iOS 上通用。',
    'docs.algo.h2': '算法覆盖',
    'docs.algo.lead': '摘要、HMAC、对称、非对称、KDF 全线覆盖；流式 Init / Update / Final 会把分片喂入的数据拼回完整明文。目标若链接 libcrypto，OpenSSL EVP 对称也一并接管。',
    'docs.mcp.h2': 'MCP 工具',
    'docs.mcp.lead': '注入的 dylib 内置一个 MCP (Model Context Protocol) 服务器，复用 8088 端口。36 个工具覆盖 Capstone 分析、内存与符号、运行时事件、沙盒文件、砸壳、捕获控制和配置。选一个工具查看调用方式。',
    'docs.mcp.in': 'tools/call',
    'docs.mcp.out': 'result',
    'docs.mcp.req': 'required: {r}',
    'docs.security.h2': '安全与合规',
    'docs.security.l1': 'Web 与 MCP 服务默认监听 0.0.0.0:8088，没有身份认证，请仅在可信局域网中使用，不要暴露到公网。',
    'docs.security.l2': '注入能力受设备环境及目标 App 保护机制影响。',
    'docs.security.l3': '请勿将捕获到的 Key、口令、明文或其他敏感数据提交到公开 Issue。',
    'docs.security.p': '遇到问题可在 GitHub Issues 反馈。',

    'news.kicker': 'NEWS · 动态',
    'news.title': '技术文章',
    'news.subtitle': '免越狱运行时分析相关的技术与架构实践。',
    'news.latest': '最新',
    'news.article': '文章',
    'news.readmore': '阅读全文 →',
    'news.back': '← 返回文章列表',

    'foot.desc': '基于 fishhook 的 iOS App 运行时加解密审计与逆向分析平台。',
    'foot.author': '插件作者',
    'foot.copy': '© 2026 IOSDecryptHub · 仅供授权安全测试与研究',
    'foot.built': 'Built with Vite · Three.js',

    'panel.search': '搜索本类: 算法/路径/明文/Hex…',
    'panel.filter': '筛选',
    'panel.cat': '分类',
    'panel.catAll': '全部',
    'panel.size': '输入大小',
    'panel.any': '不限',
    'panel.clear': '清除',
    'panel.meta': 'in:{in}B · out:{out}B',
    'panel.copyAll': '复制整条',
    'panel.copyInput': '复制明文',
    'panel.copied': '已复制',
    'panel.in': '输入 / INPUT',
    'panel.out': '输出 / OUTPUT',
    'panel.stack': '调用栈 ({n} 帧)',
    'panel.emptyList': '没有匹配记录',
    'panel.emptyDetail': '调整筛选条件后查看详情',
    'panel.filesHead': '沙盒根',
    'panel.symbolsHead': 'image 列表（导入符号均为 fishhook 候选）',
    'panel.symbolsPh': '过滤符号（如 SSL / CC / open）…',
    'panel.symbolsCount': '{n} / {m} 个',
    'panel.symbolsImports': '{n} 个导入符号',
    'panel.symbolsTh': '导入符号（均为 fishhook 候选）',
    'panel.dumpH2': '应用砸壳 (脱壳 / dump)',
    'panel.dumpP': '当前进程已加载的 App Bundle Mach-O 镜像',
    'panel.dumpImage': '镜像',
    'panel.dumpType': '类型',
    'panel.dumpSize': '大小',
    'panel.dumpStatus': '状态',
    'panel.dumpAction': '操作',
    'panel.dumpEnc': '已加密',
    'panel.dumpPlain': '未加密',
    'panel.dumpDownload': '下载',
    'panel.tab.crypto': '加解密',
    'panel.tab.sys': '系统',
    'panel.tab.net': '网络',
    'panel.tab.keychain': 'Keychain',
    'panel.tab.files': '文件',
    'panel.tab.symbols': '符号',
    'panel.tab.dump': 'Dump',
    'panel.cat.digest': '摘要',
    'panel.cat.hmac': 'HMAC',
    'panel.cat.symm': '对称',
    'panel.cat.asym': '非对称',
    'panel.cat.kdf': 'KDF',
    'panel.cat.file': '文件',
    'panel.cat.sys': '系统',
    'panel.cat.net': '网络',
    'panel.cat.keychain': 'Keychain',
  },

  en: {
    'nav.home': 'Home',
    'nav.docs': 'Docs',
    'nav.news': 'News',
    'lang.switch': '中',
    'lang.label': '中文',

    'hero.title2': 'See the truth at runtime',
    'hero.sub': 'Install the runtime plugin on your device and idh on your computer. Connect to the same trusted LAN to discover and analyze apps.',
    'hero.dl.meta': 'iOS 14.0+ · arm64 · TrollStore Injector',
    'hero.dl.title': 'Download dylib v1.23.8',
    'hero.src.meta': 'iOS 14.0+ · rootless / roothide',
    'hero.src.title': 'Add plugin repo',
    'hero.idh.meta': 'macOS / Linux · Python 3.10+',
    'hero.idh.title': 'Install idh',
    'hero.guide': 'Inject directly with TrollFools, or repack the IPA yourself.',
    'hero.trust': 'HTTP / MCP services have no authentication. Authorized testing only, trusted LAN only; never expose port 8088 to the internet.',
    'hero.scroll': 'Scroll down',

    'home.panel.kicker': 'Live Panel',
    'home.panel.title': 'The plugin runtime console, right here',
    'home.panel.lead': 'Same UI as the plugin\u2019s built-in page. Switch tabs, filter and search logs, click any record to inspect Key, IV, input/output, HexDump and call stack.',

    'docs.kicker': 'DOCS · Documentation',
    'docs.title': 'Documentation',
    'docs.subtitle': 'From injection to analysis: installation, capabilities, algorithm coverage and MCP tools.',
    'docs.toc.start': 'Quick Start',
    'docs.toc.install': 'Install & Inject',
    'docs.toc.caps': 'Capabilities',
    'docs.toc.algo': 'Algorithms',
    'docs.toc.mcp': 'MCP Tools',
    'docs.toc.security': 'Security & Compliance',
    'docs.start.h2': 'Quick Start',
    'docs.start.step1t': 'Download the dylib',
    'docs.start.step1d': 'Get decrypt_helper.dylib from the homepage or GitHub Releases.',
    'docs.start.step2t': 'Inject the target app',
    'docs.start.step2d': 'Inject directly with TrollFools, or install the jailbreak package and pick the target app.',
    'docs.start.step3t': 'Open the panel',
    'docs.start.step3d': 'Launch the target app and open http://<device IP>:8088 in a browser on the same LAN.',
    'docs.start.note': 'For your own apps or authorized security research only.',
    'docs.install.h2': 'Install & Inject',
    'docs.install.tf.h3': 'Option 1 · TrollFools injector (recommended)',
    'docs.install.tf.p1': 'For devices with a TrollStore-based injector installed:',
    'docs.install.tf.s1': 'Select the target app in the injector.',
    'docs.install.tf.s2': 'Add decrypt_helper.dylib and run the injection.',
    'docs.install.tf.s3': 'Launch the target app.',
    'docs.install.tf.s4': 'Open http://<device IP>:8088 in a browser on the same LAN.',
    'docs.install.tf.p2': 'UIs differ between injectors, but the core idea is the same: inject the dylib and relaunch the app.',
    'docs.install.src.h3': 'Option 2 · Jailbreak plugin repo',
    'docs.install.src.p1': 'Add https://ios.decrypthub.com/ in a package manager (Sileo / Zebra), install com.iosdecrypthub, then pick the target app under Settings → IOSDecryptHub. Supports rootless / roothide.',
    'docs.install.idh.h3': 'PC side · idh gateway',
    'docs.install.idh.p1': 'The plugin broadcasts its address over UDP beacons. With idh installed you never type the device IP:',
    'docs.install.idh.p2': 'idh mcp bridges the on-device HTTP MCP to a local stdio MCP, ready to use as a fixed MCP config for Codex, Claude and other AI clients.',
    'docs.install.note': 'With third-party injectors, the host app or injector must provide the NSLocalNetworkUsageDescription and NSBonjourServices Info.plist declarations.',
    'docs.caps.h2': 'Capabilities',
    'docs.caps.lead': 'Six viewpoints on the same runtime link. We intercept CommonCrypto, Security.framework and OpenSSL EVP, plus sandbox files and dynamic library loading. Identical APIs work on both macOS and iOS.',
    'docs.algo.h2': 'Algorithm coverage',
    'docs.algo.lead': 'Digest, HMAC, symmetric, asymmetric and KDF are fully covered; streaming Init / Update / Final reassembles chunked plaintext. If the target links libcrypto, OpenSSL EVP symmetric is intercepted too.',
    'docs.mcp.h2': 'MCP tools',
    'docs.mcp.lead': 'The injected dylib embeds an MCP (Model Context Protocol) server on port 8088. 36 tools cover Capstone analysis, memory & symbols, runtime events, sandbox files, decryption dumps, capture control and configuration. Pick a tool to see how to call it.',
    'docs.mcp.in': 'tools/call',
    'docs.mcp.out': 'result',
    'docs.mcp.req': 'required: {r}',
    'docs.security.h2': 'Security & compliance',
    'docs.security.l1': 'Web and MCP services listen on 0.0.0.0:8088 with no authentication. Trusted LAN only; never expose it to the public internet.',
    'docs.security.l2': 'Injection capability is subject to the device environment and target app protections.',
    'docs.security.l3': 'Never submit captured keys, passwords, plaintext or other sensitive data to public issues.',
    'docs.security.p': 'Report issues on GitHub Issues.',

    'news.kicker': 'NEWS · Articles',
    'news.title': 'Articles',
    'news.subtitle': 'Technical and architecture notes on jailbreak-free runtime analysis.',
    'news.latest': 'Latest',
    'news.article': 'Article',
    'news.readmore': 'Read more →',
    'news.back': '← Back to list',

    'foot.desc': 'fishhook-based runtime crypto audit & reverse engineering platform for iOS apps.',
    'foot.author': 'Plugin author',
    'foot.copy': '© 2026 IOSDecryptHub · For authorized security testing & research only',
    'foot.built': 'Built with Vite · Three.js',

    'panel.search': 'Search: algo/path/plain/hex…',
    'panel.filter': 'Filters',
    'panel.cat': 'Category',
    'panel.catAll': 'All',
    'panel.size': 'Input size',
    'panel.any': 'any',
    'panel.clear': 'Clear',
    'panel.meta': 'in:{in}B · out:{out}B',
    'panel.copyAll': 'Copy all',
    'panel.copyInput': 'Copy plaintext',
    'panel.copied': 'Copied',
    'panel.in': 'INPUT',
    'panel.out': 'OUTPUT',
    'panel.stack': 'Call stack ({n} frames)',
    'panel.emptyList': 'No matching records',
    'panel.emptyDetail': 'Adjust filters to see details',
    'panel.filesHead': 'Sandbox root',
    'panel.symbolsHead': 'images (all imports are fishhook candidates)',
    'panel.symbolsPh': 'Filter symbols (SSL / CC / open)…',
    'panel.symbolsCount': '{n} / {m}',
    'panel.symbolsImports': '{n} imports',
    'panel.symbolsTh': 'Imported symbols (fishhook candidates)',
    'panel.dumpH2': 'App decrypt (dump)',
    'panel.dumpP': 'App Bundle Mach-O images loaded in this process',
    'panel.dumpImage': 'Image',
    'panel.dumpType': 'Type',
    'panel.dumpSize': 'Size',
    'panel.dumpStatus': 'Status',
    'panel.dumpAction': 'Action',
    'panel.dumpEnc': 'Encrypted',
    'panel.dumpPlain': 'Not encrypted',
    'panel.dumpDownload': 'Download',
    'panel.tab.crypto': 'Crypto',
    'panel.tab.sys': 'System',
    'panel.tab.net': 'Network',
    'panel.tab.keychain': 'Keychain',
    'panel.tab.files': 'Files',
    'panel.tab.symbols': 'Symbols',
    'panel.tab.dump': 'Dump',
    'panel.cat.digest': 'Digest',
    'panel.cat.hmac': 'HMAC',
    'panel.cat.symm': 'Symmetric',
    'panel.cat.asym': 'Asymmetric',
    'panel.cat.kdf': 'KDF',
    'panel.cat.file': 'File',
    'panel.cat.sys': 'System',
    'panel.cat.net': 'Network',
    'panel.cat.keychain': 'Keychain',
  },
};

function storedLang() {
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

let lang = storedLang() === 'en' ? 'en' : 'zh';

export function getLang() {
  return lang;
}

export function t(key) {
  const table = DICT[lang] || DICT.zh;
  return table[key] ?? DICT.zh[key] ?? key;
}

export function tpl(key, values) {
  return Object.entries(values).reduce((out, [k, v]) => out.replace(`{${k}}`, String(v)), t(key));
}

export function translateStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-ph]').forEach((node) => {
    node.placeholder = t(node.dataset.i18nPh);
  });
}

export function setLang(next, { persist = true } = {}) {
  if (next !== 'zh' && next !== 'en') return;
  lang = next;
  if (persist) {
    try {
      localStorage.setItem(LS_KEY, next);
    } catch {
      /* ignore */
    }
  }
  document.documentElement.lang = next === 'en' ? 'en' : 'zh-CN';
  translateStatic();
  document.dispatchEvent(new CustomEvent('idh:langchange', { detail: next }));
}

export function initI18n() {
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  translateStatic();
}
