// 技术文章（news）数据源。
// 每篇文章携带中英文双语内容：title/summary/content + en.title/en.summary/en.content。
// 新增文章：复制一个对象追加到数组即可，slug 需唯一。content 为 markdown。

export const NEWS_ARTICLES = [
  {
    slug: 'how-it-works-architecture',
    date: '2026-08-04',
    title: 'IOSDecryptHub 工作原理：从注入到分析的一条完整链路',
    summary: '把前面几篇文章串起来：constructor 启动顺序为什么不能换、三种 hook 手段怎么分工、日志存储如何"在别人进程里不崩溃"、一个 8088 端口怎么承载面板与 MCP，以及跨事件时间窗关联。',
    content: `前面几篇文章拆开了讲各个模块。这篇把它们串起来：注入的 dylib 在目标进程里，到底走了一条怎样的数据流。

## 全景：一条链路

\`\`\`
hook (fishhook + swizzle + dlsym 重定向)
  → 捕获与语义化 (算法解析 / 流式会话 / 行为事件)
    → DHLogStore (分类环形缓冲 + 落盘滚动)
      → HTTP 8088 (Web 面板 / /api/stats / MCP POST /api/mcp)
        → idh (手动连接 + stdio 网关) → AI 客户端
\`\`\`

每一层只做一件事，层与层之间通过 \`DHLogEntry\` 传递。

## 启动顺序：为什么不能换

dylib 在 \`main()\` 之前通过 \`__attribute__((constructor))\` 启动，顺序是写死的：

1. **预热 Foundation**：先调一次 \`DHTimestampNow()\` 和 \`DHCallStackFiltered()\`，强制完成 NSDateFormatter 与 backtrace 的懒加载；
2. **加载配置**：\`.dh_capture.conf\`（捕获开关）、\`.dh_noise.conf\`（噪声规则）、\`.dh_spoof.conf\`（伪装配置），在装 hook 前就绪，持久化的开关从一开始就生效；
3. **装 hook**：\`dh_install_all_hooks()\` 一次装完 12 类（摘要/HMAC/对称/非对称/KDF/EVP/文件/系统/网络/Keychain/dyld/dlsym）——要尽早，否则早期发生的加解密会漏抓；
4. **起 HTTP 服务**：不依赖 UIApplication，立刻可访问；
5. **悬浮窗**：等 \`UIApplicationDidFinishLaunching\` 通知后置初始化。

顺序不能换的原因很实际：若先装 hook 再预热，\`hooked_open\` 内部首次触发 \`NSDateFormatter\` 懒加载会再次调用 \`open\`——无限递归（\`dh_in_hook\` 标志是第二道保险）。

## Hook 引擎：三种手段各管一段

- **fishhook**：改写 GOT / 懒符号表指针，管 C 函数——CommonCrypto、SecKey、EVP、open/write/dlopen 全走这里；
- **ObjC swizzle**：runtime 换 IMP，管 ObjC 方法——\`NSURLSession\` 建任务、\`UIDevice.systemVersion\`、\`canOpenURL:\`；
- **dlsym 重定向**：\`dlsym\` 解析到已 hook 符号时返回 wrapper，堵住函数指针旁路。

三者共用"改指针不改指令"的边界：非越狱环境没有可执行内存权限，inline hook 物理上不可能。

## 捕获与语义化

原始参数没有意义，要翻译成可读记录：

- 算法：\`alg\` 枚举 + \`keyLen\` → "AES-256-CBC"；\`kCCOptionECBMode\` → 模式；SecKey 从 CFDictionary 里抠 \`kSecAttrKeyType\`；
- 流式：\`CCCryptorCreate/Update/Final\` 用会话表拼回完整明文；
- 行为：文件路径、dlopen 的库名、请求 URL 与方法。

每条记录带应用层调用栈、毫秒时间戳与线程 id——这三个字段是后面一切联动的基础。

## 日志存储：分类缓冲 + 落盘滚动

\`DHLogStore\` 的存储策略针对"宿主 App 不能死"设计：

- **每类独立环形缓冲**：加解密、文件、系统、网络、Keychain 各占一个桶，一类高频事件不会挤爆别的类；
- **噪声桶**：\`MGCopyAnswer\` 这类高频系统调用按规则分流到独立噪声板，不进主事件流；
- **落盘**：常开 append 句柄（避免每条记录 open/close），单段 blob 上限 64KB；
- **滚动**：超过 \`maxFileBytes\` 后滚动归档，保留 \`.1/.2/.3\` 最多三份——崩溃后可从落盘日志闭环取证（断连不清空）。

## 服务层：一个端口承载全部

HTTP 8088 一个监听端口同时服务三个角色：Web 面板（\`/\`）、健康与统计（\`/api/stats\`）、MCP（\`POST /api/mcp\`，Streamable HTTP）。不额外开端口，因为注入场景每多一个监听端口就多一分被 App 检测的风险。

服务的每个动作都遵守"不崩溃原则"：内存读取用 \`vm_read_overwrite\` 防护，ObjC 层用 \`@try/@catch\`，日志与网络失败静默降级——dylib 运行在别人的进程里，任何 crash 都会杀死宿主 App。

## 连接与协作：idh 网关

设备端只做捕获与暴露，分析入口在 PC：

- \`idh connect <设备 IP>:8088\` 手动指定设备（不做自动发现，降低复杂度）；
- \`idh mcp\` 把 HTTP MCP 桥接成本机 stdio MCP，Codex / Claude 直接配置使用；
- 网关提供 \`idh_list_devices\` / \`idh_call_tool\` 等固定工具集，AI 按 schema 确定性路由。

## 跨事件关联：时间窗锚点

网络与加解密共享时间线是这套设计最独特的地方。\`net_log_pair\` 记录的是**请求时刻**的毫秒时间戳与线程 id（不是响应到达时刻），\`correlate_request\` 以网络请求为锚点，聚合同一时间窗内的加解密与 Keychain 事件——一次登录请求的签名、加密、写 Keychain 全部落在同一条因果链上。

## 铁律回顾

- 只改指针，不改指令；
- 无认证服务只在可信局域网使用；
- 伪装与隐藏仅作用于本进程内；
- 所有内存访问都有崩溃防护。

这条链路从 \`main()\` 之前的第一行代码，到 AI 客户端读到的结构化事件，每一层都围绕同一个约束设计：**稳定地活在别人的进程里**。`,
    en: {
      title: 'How IOSDecryptHub works: one pipeline from injection to analysis',
      summary: 'Wiring the previous posts together: why the constructor startup order cannot change, how the three hook tools divide the work, how the log store survives inside a foreign process, how one port serves the panel and MCP, and cross-event time-window correlation.',
      content: `Previous articles dissected each module. This one wires them together: inside the target process, what data flow does the injected dylib actually follow?

## The big picture: one pipeline

\`\`\`
hook (fishhook + swizzle + dlsym redirection)
  → capture & semantics (algorithm parsing / streaming sessions / behavior events)
    → DHLogStore (per-category ring buffers + rolling disk logs)
      → HTTP 8088 (Web panel / /api/stats / MCP POST /api/mcp)
        → idh (manual connect + stdio gateway) → AI clients
\`\`\`

Each layer does one thing; layers communicate via \`DHLogEntry\`.

## Startup order: why it cannot change

The dylib starts before \`main()\` via \`__attribute__((constructor))\`, in a fixed order:

1. **Warm up Foundation**: call \`DHTimestampNow()\` and \`DHCallStackFiltered()\` once to force lazy loading of NSDateFormatter and backtrace;
2. **Load config**: \`.dh_capture.conf\` (capture toggles), \`.dh_noise.conf\` (noise rules), \`.dh_spoof.conf\` (spoof config)—ready before hooks install, so persisted switches apply from the start;
3. **Install hooks**: \`dh_install_all_hooks()\` installs all 12 families at once (digest/HMAC/symmetric/asymmetric/KDF/EVP/file/system/network/Keychain/dyld/dlsym)—as early as possible, or early crypto would be missed;
4. **Start HTTP**: no UIApplication dependency, reachable immediately;
5. **Floating window**: post-initialized on \`UIApplicationDidFinishLaunching\`.

Why this exact order: if hooks were installed before the warm-up, the first NSDateFormatter lazy load inside \`hooked_open\` would call \`open\` again—infinite recursion (the \`dh_in_hook\` flag is the second safety net).

## Hook engine: three tools, three layers

- **fishhook**: rewrites GOT / lazy symbol pointers—C functions: CommonCrypto, SecKey, EVP, open/write/dlopen;
- **ObjC swizzle**: runtime IMP swap—ObjC methods: \`NSURLSession\` task creation, \`UIDevice.systemVersion\`, \`canOpenURL:\`;
- **dlsym redirection**: lookups of already-hooked symbols return the wrapper, closing the function-pointer bypass.

All three share one boundary: "change pointers, not instructions". Without jailbreak, there is no executable memory—inline hooks are physically impossible.

## Capture & semantics

Raw arguments mean nothing; they must be translated:

- Algorithms: \`alg\` enum + \`keyLen\` → "AES-256-CBC"; \`kCCOptionECBMode\` → mode; SecKey digs \`kSecAttrKeyType\` out of a CFDictionary;
- Streaming: \`CCCryptorCreate/Update/Final\` sessions reassemble full plaintext;
- Behavior: file paths, dlopen'd library names, request URLs and methods.

Every record carries an app-level call stack, millisecond timestamp and thread id—the three fields everything downstream links on.

## Log store: per-category buffers + rolling disk logs

\`DHLogStore\` is designed around one constraint: **the host app must not die**.

- **Per-category ring buffers**: crypto, file, system, network, Keychain each get their own bucket; one hot category cannot starve others;
- **Noise buckets**: high-frequency system calls like \`MGCopyAnswer\` are diverted to noise boards by rule, off the main event stream;
- **Disk**: a persistent append handle (no open/close per record); single blob capped at 64KB;
- **Rolling**: past \`maxFileBytes\`, logs rotate keeping \`.1/.2/.3\`—crashes are closed-loop forensics (disconnects never clear logs).

## Service layer: one port for everything

HTTP 8088 serves three roles on one listener: the Web panel (\`/\`), health & stats (\`/api/stats\`), and MCP (\`POST /api/mcp\`, Streamable HTTP). No extra ports—every extra listener is one more detection surface for the injected process.

Every service action obeys the no-crash rule: memory reads guarded by \`vm_read_overwrite\`, ObjC wrapped in \`@try/@catch\`, logging and network failures degrade silently—the dylib lives in someone else's process; any crash kills the host app.

## Connection & collaboration: the idh gateway

The device only captures and exposes; analysis entry is on the PC:

- \`idh connect <device IP>:8088\`—manual device specification (no auto-discovery, less complexity);
- \`idh mcp\` bridges HTTP MCP to local stdio MCP for Codex / Claude;
- The gateway exposes a fixed toolset (\`idh_list_devices\` / \`idh_call_tool\`), deterministic routing by schema.

## Cross-event correlation: the time-window anchor

Network and crypto sharing one timeline is this design's most distinctive trait. \`net_log_pair\` records the **request-time** millisecond timestamp and thread id (not response time); \`correlate_request\` anchors on the network request and aggregates same-window crypto and Keychain events—one login request's signature, encryption and Keychain write all land on the same causal chain.

## The rules, restated

- Pointers only, never instructions;
- Unauthenticated services stay on trusted LANs;
- Spoofing and hiding act only within the process;
- Every memory access has crash protection.

From the first line before \`main()\` to the structured events an AI client reads, every layer is designed around the same constraint: **survive stably inside someone else's process**.`,
    },
  },
  {
    slug: 'hook-engine-inventory',
    date: '2026-08-04',
    title: 'Hook 引擎实现：十二类 hook 的安装面与重入防护',
    summary: '不只是 fishhook 原理——完整列出我们实际 hook 的符号：宏生成的 32 个摘要函数、EVP 家族、SecItem 四件套、dyld 枚举观察点，以及 dlsym 重定向注册表和 dh_in_hook 重入防护。',
    content: `前面讲 fishhook 原理，这里展示我们实际 hook 了什么、怎么装、怎么防自己人。整个 hook 面由 \`dh_install_all_hooks()\` 一次性安装，共十二类：

\`\`\`
digest / hmac / symmetric / asymmetric / kdf / evp     ← 加解密六类
file / system / keychain / env / dyld / network       ← 行为六类
\`\`\`

## 加解密六类的 rebinding 清单

摘要类用宏生成，一次展开 8 个一次性函数 + 24 个流式函数：

\`\`\`c
#define HOOK_DIGEST(NAME, CTX_T)                                        \
    static unsigned char *hooked_##NAME(const void *data, CC_LONG len, unsigned char *md) { \
        ... /* 记录 data/len/md */                                      \
        return orig_##NAME(data, len, md);                              \
    }                                                                   \
    static int hooked_##NAME##_Init(CTX_T *c) { ... }                   \
    static int hooked_##NAME##_Update(CTX_T *c, const void *data, CC_LONG len) { ... } \
    static int hooked_##NAME##_Final(unsigned char *md, CTX_T *c) { ... }

HOOK_DIGEST(CC_MD2,  CC_MD2_CTX)   HOOK_DIGEST(CC_MD4,  CC_MD4_CTX)
HOOK_DIGEST(CC_MD5,  CC_MD5_CTX)   HOOK_DIGEST(CC_SHA1, CC_SHA1_CTX)
HOOK_DIGEST(CC_SHA224, CC_SHA256_CTX)  ...   /* SHA224/256/384/512 同理 */
\`\`\`

HMAC 一条龙 \`CCHmac\` + 流式 \`CCHmacInit/Update/Final\`；对称 6 个（\`CCCrypt\` 一次性 + \`CCCryptorCreate/CreateWithMode/Update/Final/Release\`）；非对称 4 个（\`SecKeyCreateSignature\` / \`SecKeyVerifySignature\` / \`SecKeyCreateEncryptedData\` / \`SecKeyCreateDecryptedData\`）；KDF 一个 \`CCKeyDerivationPBKDF\`；EVP 家族按 OpenSSL 1.1+ 的命名展开：\`EVP_EncryptInit_ex\` / \`EVP_DecryptInit_ex\` / \`EVP_CipherInit_ex\` 及 \`_ex2\` 变体，再加 Update / Final。

## 行为六类 hook 了什么

- **file**：\`open\` / \`write\` / \`unlink\` / \`rename\`——open 还按 \`flags\` 解析出"读/写/创建/追加/截断"；路径先过越狱隐藏黑名单再放行；
- **system**：\`dlopen\`（记录加载的库）与 \`dlsym\`（见下）；
- **keychain**：\`SecItemCopyMatching\` / \`SecItemAdd\` / \`SecItemUpdate\` / \`SecItemDelete\`——把 CFDictionary 的 service/account/data 字段翻译成可读记录；
- **env**：\`ptrace\`——\`PT_DENY_ATTACH\` 是经典反调试入口，hook 后记录并拦截；
- **dyld**：\`_dyld_get_image_name\` 与 \`dladdr\`——这两个是"谁在枚举我"的观察点，同时承担镜像隐藏；
- **network**：\`NSURLSession\` 三个 completion 建任务方法（swizzle）+ \`-[NSURLSessionTask resume]\` + \`SSL_write\` / \`SSL_read\`（fishhook）。

## dlsym 重定向：堵住旁路

fishhook 只改 GOT 表项，\`dlsym(RTLD_DEFAULT, "CCCrypt")\` 会绕过。\`hooked_dlsym\` 先调原实现拿真实地址，再查一张**重定向注册表**（\`dh_dlsym_register_rebindings\`，与 fishhook 的 rebinding 数组同源）：命中已 hook 符号时返回 wrapper 地址。dyld / SSL 的 hook 同样注册进这张表，保证"动态取址"也落在我们的网里。

## 防自己人：重入防护

hook 自己的实现也会调用 \`open\` / \`NSDateFormatter\` 等被 hook 的符号——\`dh_in_hook\` 线程级标志在 hook 体内置位，命中即透传原函数，避免递归与死锁。constructor 里先预热 \`DHTimestampNow()\` / \`DHCallStackFiltered()\` 是第二道保险：懒加载在 hook 安装前完成，杜绝 \`hooked_open\` 内部再触发 \`open\`。

## fail-loud：装没装上都告诉你

每个 hook 装完自检：\`dh_health_hook_fail\` 上报失败的符号（比如 \`-[NSURLSessionTask resume]\` 在 iOS 版本间方法缺失），\`/api/stats\` 的 health 字段可见 \`installed/failed\` 计数。这是"不崩溃原则"的延伸——装不上的 hook 静默降级，但绝不 crash。`,
    en: {
      title: 'Hook engine internals: the twelve-family install surface and re-entry guards',
      summary: 'More than fishhook theory—the full inventory of what we hook: 32 macro-generated digest functions, the EVP family, the SecItem quartet, dyld enumeration observation points, the dlsym redirection registry and dh_in_hook re-entry guards.',
      content: `The previous post covered fishhook's internals; here is what we actually hook, how it is installed, and how we avoid hooking ourselves. The whole surface is installed at once by \`dh_install_all_hooks()\`, twelve families:

\`\`\`
digest / hmac / symmetric / asymmetric / kdf / evp     <- six crypto families
file / system / keychain / env / dyld / network       <- six behavior families
\`\`\`

## The rebinding inventory: crypto families

Digest hooks are generated by macro—8 one-shot functions plus 24 streaming ones:

\`\`\`c
#define HOOK_DIGEST(NAME, CTX_T)                                        \
    static unsigned char *hooked_##NAME(const void *data, CC_LONG len, unsigned char *md) { \
        ... /* log data/len/md */                                       \
        return orig_##NAME(data, len, md);                              \
    }                                                                   \
    static int hooked_##NAME##_Init(CTX_T *c) { ... }                   \
    static int hooked_##NAME##_Update(CTX_T *c, const void *data, CC_LONG len) { ... } \
    static int hooked_##NAME##_Final(unsigned char *md, CTX_T *c) { ... }

HOOK_DIGEST(CC_MD2,  CC_MD2_CTX)   HOOK_DIGEST(CC_MD4,  CC_MD4_CTX)
HOOK_DIGEST(CC_MD5,  CC_MD5_CTX)   HOOK_DIGEST(CC_SHA1, CC_SHA1_CTX)
HOOK_DIGEST(CC_SHA224, CC_SHA256_CTX)  ...   /* SHA224/256/384/512 likewise */
\`\`\`

HMAC: \`CCHmac\` one-shot plus streaming \`CCHmacInit/Update/Final\`. Symmetric: six (\`CCCrypt\` plus \`CCCryptorCreate/CreateWithMode/Update/Final/Release\`). Asymmetric: four (\`SecKeyCreateSignature\` / \`SecKeyVerifySignature\` / \`SecKeyCreateEncryptedData\` / \`SecKeyCreateDecryptedData\`). KDF: one (\`CCKeyDerivationPBKDF\`). EVP expands along OpenSSL 1.1+ naming: \`EVP_EncryptInit_ex\` / \`EVP_DecryptInit_ex\` / \`EVP_CipherInit_ex\` and their \`_ex2\` variants, plus Update / Final.

## What the behavior families hook

- **file**: \`open\` / \`write\` / \`unlink\` / \`rename\`—open also parses \`flags\` into "read/write/create/append/truncate"; paths pass the jailbreak-hide blacklist before being logged;
- **system**: \`dlopen\` (log loaded libraries) and \`dlsym\` (below);
- **keychain**: \`SecItemCopyMatching\` / \`SecItemAdd\` / \`SecItemUpdate\` / \`SecItemDelete\`—CFDictionary service/account/data fields translated into readable records;
- **env**: \`ptrace\`—\`PT_DENY_ATTACH\` is the classic anti-debug entry, hooked and blocked;
- **dyld**: \`_dyld_get_image_name\` and \`dladdr\`—both observation points for "who is enumerating me" and the image-hiding surface;
- **network**: three \`NSURLSession\` completion task-creation methods (swizzle) + \`-[NSURLSessionTask resume]\` + \`SSL_write\` / \`SSL_read\` (fishhook).

## dlsym redirection: closing the bypass

fishhook only rewrites GOT entries; \`dlsym(RTLD_DEFAULT, "CCCrypt")\` bypasses them. \`hooked_dlsym\` calls the original first, then consults a **redirection registry** (\`dh_dlsym_register_rebindings\`, fed from the same rebinding arrays as fishhook): hits return the wrapper address. dyld and SSL hooks register here too, so "dynamic lookup" always lands in our net.

## Guarding against ourselves: re-entry protection

Our own implementations also call hooked symbols (\`open\`, \`NSDateFormatter\`...). The \`dh_in_hook\` thread-local flag is set inside hook bodies; when set, calls pass straight through to the original—no recursion, no deadlock. Warming up \`DHTimestampNow()\` / \`DHCallStackFiltered()\` in the constructor is the second safety net: lazy loading finishes before hooks install, so \`hooked_open\` never triggers \`open\` internally.

## fail-loud: you know what did not install

Every hook self-checks after install: \`dh_health_hook_fail\` reports symbols that failed (e.g. \`-[NSURLSessionTask resume]\` missing on some iOS versions), and \`/api/stats\` exposes \`installed/failed\` counts. This extends the no-crash rule—an unhookable symbol degrades silently, but never crashes.`,
    },
  },
  {
    slug: 'crypto-capture-semantics',
    date: '2026-08-04',
    title: '加解密捕获实现：参数语义化与会话状态机',
    summary: '从 CCCrypt 的枚举翻译到流式会话表：44 个 API 怎么解析、SecKeyRef 为什么不读内部、EVP 怎么用 dlsym 懒解析辅助符号、永不 Final 的会话怎么回收。',
    content: `加解密捕获的技术含量在**参数语义化**与**会话状态管理**。原始 C 参数是一堆枚举和指针，要变成 "AES-256-CBC · encrypt · PKCS7" 这种可读记录。

## 一次性调用：CCCrypt 的参数翻译

\`CCCrypt\` 的 8 个参数全在寄存器与栈上，hook 拿到后按序解析：

\`\`\`c
CCCryptorStatus CCCrypt(
    CCOperation op,        // 0=encrypt 1=decrypt
    CCAlgorithm alg,       // kCCAlgorithmAES=0, DES=1, 3DES=2, CAST=5
    CCOptions options,     // kCCOptionPKCS7Padding(1) | kCCOptionECBMode(2)
    const void *key, size_t keyLen,
    const void *iv,
    const void *dataIn, size_t dataInLength,
    void *dataOut, size_t dataOutLength, size_t *dataOutMoved);
\`\`\`

翻译规则：

- **算法名**：\`alg\` 枚举 + \`keyLen\` → "AES-256-CBC"（\`kCCAlgorithmAES=0\` 且 keyLen=32 → AES-256）；
- **模式**：\`options & kCCOptionECBMode\` 置位 → ECB，否则 CBC；填充位 \`kCCOptionPKCS7Padding\`；
- **key/iv**：在调用原函数**之前**读取——加解密前缓冲区里还是原始材料；
- **明文方向**：encrypt 时 input 是明文，decrypt 时 output 是明文，操作位决定哪个字段标记 \`plain\`。

## 流式会话：Create → Update → Final 的状态机

大文件走 \`CCCryptorCreate/Update/Final/Release\`，四条独立调用之间只隔一个不透明的 \`CCCryptorRef\`。hook 维护一张以 \`cryptorRef\` 为 key 的会话表：

| 调用 | hook 动作 |
|---|---|
| \`CCCryptorCreate\` / \`CreateWithMode\` | 建会话：记算法、模式、key、iv、操作位 |
| \`CCCryptorUpdate\` | 把 \`dataIn\` 追加进会话缓冲，**不落记录**（分片无意义） |
| \`CCCryptorFinal\` | 拼出完整明文/密文，此时才输出一条完整记录（含累计长度） |
| \`CCCryptorRelease\` | 删除会话 |

两个 edge case：

1. **Update 多次后 Final 的拼装**：缓冲区按调用顺序追加，Final 时一次性输出；
2. **永不 Final 的会话**：App 持有一个 \`cryptorRef\` 反复 Update 却不收尾——这是状态泄漏，靠 \`CCCryptorRelease\` 钩子回收，避免会话表无限增长。

## SecKey：从 CFDictionary 抠算法

\`SecKeyCreateSignature\` 的算法参数是一个 CFDictionary。hook 用 \`CFDictionaryGetValue\` 逐个取 \`kSecAttrKeyType\`（RSA/EC）、\`kSecAttrKeySizeInBits\`、\`kSecAttrKeyClass\`（private/public），拼出 "RSA-2048 PKCS1v15-SHA256" / "EC secp256r1" 这类 algid。SecKeyRef 本身是不透明指针——我们**不读它的内部**，只记录其地址与用途，避免触碰 Apple 私有结构。

## EVP：辅助符号的懒解析

OpenSSL 1.1+ 把算法元数据藏在 \`EVP_CIPHER\` 结构体里。hook 侧用 \`dlsym\` 懒解析辅助函数：

\`\`\`c
fn_CIPHER_get0_name  = dlsym(RTLD_DEFAULT, "EVP_CIPHER_get0_name");
fn_CIPHER_key_length = dlsym(RTLD_DEFAULT, "EVP_CIPHER_key_length");
fn_CIPHER_iv_length  = dlsym(RTLD_DEFAULT, "EVP_CIPHER_iv_length");
\`\`\`

拿到 \`EVP_CIPHER\` 指针后调用这些**原版**辅助函数取算法名与长度——不解析结构体布局，天然兼容 OpenSSL 1.1/3.x。AEAD（AES-GCM / ChaCha20-Poly1305）的 AAD/tag 通过 \`EVP_CIPHER_CTX_ctrl\` 设置，hook 该调用单独记录。

## KDF：把口令留下来

\`CCKeyDerivationPBKDF\` 的输入直接包含口令明文、salt、迭代次数——调用后派生密钥也拿到了。这类记录是"恢复弱口令/慢哈希"分析的输入。

## 与噪声板的关系

加解密面默认全部入主事件流；\`MGCopyAnswer\` 这类**系统自己的**加密调用按噪声规则分流到独立噪声桶，避免把面板刷爆。`,
    en: {
      title: 'Crypto capture internals: parameter semantics and the session state machine',
      summary: 'From CCCrypt enum translation to the streaming session table: how 44 APIs are parsed, why SecKeyRef internals are never read, how EVP lazily resolves helpers via dlsym, and how never-Final sessions are reclaimed.',
      content: `The craft of crypto capture is **parameter semantics** and **session state management**. Raw C arguments are enums and pointers; they must become readable records like "AES-256-CBC · encrypt · PKCS7".

## One-shot: CCCrypt parameter translation

All 8 \`CCCrypt\` parameters sit on the stack; the hook parses them in order:

\`\`\`c
CCCryptorStatus CCCrypt(
    CCOperation op,        // 0=encrypt 1=decrypt
    CCAlgorithm alg,       // kCCAlgorithmAES=0, DES=1, 3DES=2, CAST=5
    CCOptions options,     // kCCOptionPKCS7Padding(1) | kCCOptionECBMode(2)
    const void *key, size_t keyLen,
    const void *iv,
    const void *dataIn, size_t dataInLength,
    void *dataOut, size_t dataOutLength, size_t *dataOutMoved);
\`\`\`

Translation rules:

- **Algorithm name**: \`alg\` enum + \`keyLen\` → "AES-256-CBC" (\`kCCAlgorithmAES=0\` with keyLen=32 → AES-256);
- **Mode**: \`options & kCCOptionECBMode\` set → ECB, else CBC; padding from \`kCCOptionPKCS7Padding\`;
- **key/iv**: read **before** calling the original—buffers still hold raw material pre-op;
- **Plaintext direction**: encrypt → input is plaintext; decrypt → output is plaintext; the op bit decides which field is marked \`plain\`.

## Streaming sessions: the Create → Update → Final state machine

Large payloads use \`CCCryptorCreate/Update/Final/Release\`—four separate calls joined only by an opaque \`CCCryptorRef\`. The hook keeps a session table keyed by \`cryptorRef\`:

| Call | Hook action |
|---|---|
| \`CCCryptorCreate\` / \`CreateWithMode\` | create session: algorithm, mode, key, iv, direction |
| \`CCCryptorUpdate\` | append \`dataIn\` to the session buffer—**no record yet** (a chunk is meaningless) |
| \`CCCryptorFinal\` | reassemble full plaintext/ciphertext; only now emit one complete record (with cumulative length) |
| \`CCCryptorRelease\` | destroy session |

Two edge cases:

1. **Ordering across multiple Updates**: buffer appends in call order; Final flushes it once;
2. **Sessions that never Final**: an app Update-looping on a held \`cryptorRef\` without closing is a state leak—reclaimed via the \`CCCryptorRelease\` hook so the table never grows unbounded.

## SecKey: digging the algorithm out of a CFDictionary

\`SecKeyCreateSignature\` takes its algorithm as a CFDictionary. The hook pulls \`kSecAttrKeyType\` (RSA/EC), \`kSecAttrKeySizeInBits\`, \`kSecAttrKeyClass\` (private/public) via \`CFDictionaryGetValue\`, building algids like "RSA-2048 PKCS1v15-SHA256" or "EC secp256r1". \`SecKeyRef\` itself is opaque—we never read its internals, only record address and purpose, avoiding Apple private structures.

## EVP: lazy resolution of helper symbols

OpenSSL 1.1+ hides algorithm metadata inside \`EVP_CIPHER\`. The hook lazily resolves helpers via \`dlsym\`:

\`\`\`c
fn_CIPHER_get0_name  = dlsym(RTLD_DEFAULT, "EVP_CIPHER_get0_name");
fn_CIPHER_key_length = dlsym(RTLD_DEFAULT, "EVP_CIPHER_key_length");
fn_CIPHER_iv_length  = dlsym(RTLD_DEFAULT, "EVP_CIPHER_iv_length");
\`\`\`

Given an \`EVP_CIPHER*\`, these **original** helpers return the name and lengths—no struct layout parsing, compatible with OpenSSL 1.1/3.x out of the box. AEAD (AES-GCM / ChaCha20-Poly1305) AAD/tag flows through \`EVP_CIPHER_CTX_ctrl\`, hooked and logged separately.

## KDF: keep the passphrase

\`CCKeyDerivationPBKDF\` receives the plaintext passphrase, salt and iteration count directly; the derived key follows. These records feed weak-password / slow-hash analysis.

## The noise-board relationship

The crypto surface logs to the main stream by default; system-internal calls like \`MGCopyAnswer\` are diverted to noise boards by rule, so the panel never floods.`,
    },
  },
  {
    slug: 'jailbreak-hiding-surface',
    date: '2026-08-04',
    title: '越狱隐藏的实现：五条检测面与三层 hook 回答',
    summary: '文件层回 ENOENT、dyld 层换镜像名、ObjC 层过滤 scheme、ptrace/sysctl 反调试——逐条对照检测点讲我们 hook 了什么、怎么回答假答案。',
    content: `"隐藏越狱"不是藏起自己，而是**在检测点回答假答案**。先列 App 会怎么查，再对照我们的 hook 面。

## 检测的五条攻击面

1. **文件系统探测**：\`access("/var/jb")\`、\`stat("/bin/bash")\`、读 \`/private/var/tmp/cydia.log\`——rootless 越狱根在 \`/var/jb\`，路径枚举成本最低；
2. **URL scheme**：\`canOpenURL:@"cydia://"\`；
3. **dylib 枚举**：遍历 \`_dyld_image_count\` / \`_dyld_get_image_name\` 找 \`libjailbreak.dylib\`、\`Cephei\`、\`Choicy\`、\`DynamicLibraries\`；
4. **沙箱逃逸探测**：\`fork()\` 返回值、\`/Applications\` 可写性；
5. **反调试**：\`sysctl(mib, 4, ...)\` 读 \`KERN_PROC\` 的 \`P_TRACED\` 标志；\`ptrace(PT_DENY_ATTACH, ...)\`。

## 文件层：路径黑名单回 ENOENT

\`hook_file\` 的 \`hooked_open\` 在放行前先过黑名单：

\`\`\`c
if (dh_spoof_jb_should_hide_path(path)) {
    dh_log_hidden("open", path);
    errno = ENOENT;
    return -1;
}
int fd = orig_open(path, flags, mode);
\`\`\`

黑名单默认覆盖 \`/var/jb\`、\`/bin/bash\`、\`/usr/lib/libjailbreak.dylib\`、\`/private/var/tmp/cydia.log\` 等；\`dh_spoof_jb_add_path\` 支持把新发现的检测路径动态加进去。**access/stat 与 open 走同一判定**，保证三条探测路径返回一致（不会出现 stat 说存在、open 说不存在）。

## dyld 层：枚举观察点改答案

\`_dyld_get_image_name\` 与 \`dladdr\` 被 hook（\`hook_dyld\`），这两个函数既是"谁在枚举我"的观察点，也是镜像隐藏的执行点：

\`\`\`c
static const char *hooked_dyld_get_image_name(uint32_t index) {
    const char *real = orig_dyld_get_image_name(index);
    if (real && dh_spoof_should_hide_image(real)) {
        dyld_log_hidden_once(real);
        return kBenignImageName;   // 返回一个无害的占位名
    }
    return real;
}

static int hooked_dladdr(const void *addr, Dl_info *info) {
    int r = orig_dladdr(addr, info);
    if (r != 0 && info && info->dli_fname && dh_spoof_should_hide_image(info->dli_fname)) {
        info->dli_fname = kBenignImageName;   // 抹掉真实路径，保持调用成功
    }
    return r;
}
\`\`\`

\`dyld_log_hidden_once\` 保证每条隐藏只记一次，不刷屏。

## ObjC 层：scheme 过滤与设备伪装

fishhook 改不了 ObjC 方法，用 runtime swizzle（\`dh_swizzle\` 封装 \`method_getImplementation\` + \`method_setImplementation\`）：

- \`-[UIApplication canOpenURL:]\`：解析 scheme，命中 \`cydia\` 等黑名单返回 NO；
- \`-[UIDevice systemVersion]\` / \`-[UIDevice name]\` / \`-[UIDevice identifierForVendor]\`：返回配置值；
- \`-[NSProcessInfo operatingSystemVersion]\`：返回配置值；
- \`-[ASIdentifierManager advertisingIdentifier]\`：返回配置 UUID。

每个 swizzle 都带"配置为空则透传原实现"的守卫——伪装是**可选**的，不配置就不干预。

## 反调试：ptrace 与 sysctl

\`ptrace\` 被 hook（\`hook_env\`），\`PT_DENY_ATTACH\` 直接拦截；\`sysctl\` 的 \`KERN_PROC_PID\` 查询被记录，\`P_TRACED\` 位在 spoof 开启时清零后返回。这里的原则是"让**查询**看到没被调试"，而不是让调试器真的失败——后者反而暴露存在。

## 边界：伪装只在进程内

所有隐藏都作用在**本进程的 API 返回值**上。跨 App 调用、系统服务、服务端画像不受影响。这也是为什么我们把它叫"进程内伪装"而不是"隐身"。`,
    en: {
      title: 'Jailbreak hiding internals: five detection surfaces, three hook layers',
      summary: 'ENOENT at the file layer, swapped image names at the dyld layer, scheme filtering at the ObjC layer, ptrace/sysctl anti-debugging—what we hook and how fake answers are served at each detection point.',
      content: `Hiding jailbreak is not about hiding yourself—it is about **answering fake answers at the detection points**. Here is how apps check, mapped against our hook surface.

## Five detection surfaces

1. **Filesystem probes**: \`access("/var/jb")\`, \`stat("/bin/bash")\`, reading \`/private/var/tmp/cydia.log\`—rootless roots live at \`/var/jb\`; path enumeration is the cheapest check;
2. **URL schemes**: \`canOpenURL:@"cydia://"\`;
3. **dylib enumeration**: walk \`_dyld_image_count\` / \`_dyld_get_image_name\` for \`libjailbreak.dylib\`, \`Cephei\`, \`Choicy\`, \`DynamicLibraries\`;
4. **Sandbox escape probes**: \`fork()\` returns, writable \`/Applications\`;
5. **Anti-debugging**: \`sysctl(mib, 4, ...)\` reading the \`P_TRACED\` flag of \`KERN_PROC\`; \`ptrace(PT_DENY_ATTACH, ...)\`.

## File layer: path blacklist returns ENOENT

\`hooked_open\` checks the blacklist before passing through:

\`\`\`c
if (dh_spoof_jb_should_hide_path(path)) {
    dh_log_hidden("open", path);
    errno = ENOENT;
    return -1;
}
int fd = orig_open(path, flags, mode);
\`\`\`

The blacklist defaults to \`/var/jb\`, \`/bin/bash\`, \`/usr/lib/libjailbreak.dylib\`, \`/private/var/tmp/cydia.log\` etc.; \`dh_spoof_jb_add_path\` adds newly-discovered paths at runtime. **access/stat and open share the same predicate**, so all three probe paths agree (no "stat says exists, open says not").

## dyld layer: changing answers at the enumeration observation points

\`_dyld_get_image_name\` and \`dladdr\` are hooked (\`hook_dyld\`)—both observation points for "who is enumerating me" and the image-hiding surface:

\`\`\`c
static const char *hooked_dyld_get_image_name(uint32_t index) {
    const char *real = orig_dyld_get_image_name(index);
    if (real && dh_spoof_should_hide_image(real)) {
        dyld_log_hidden_once(real);
        return kBenignImageName;   // a harmless placeholder name
    }
    return real;
}

static int hooked_dladdr(const void *addr, Dl_info *info) {
    int r = orig_dladdr(addr, info);
    if (r != 0 && info && info->dli_fname && dh_spoof_should_hide_image(info->dli_fname)) {
        info->dli_fname = kBenignImageName;   // wipe the real path, keep the call succeeding
    }
    return r;
}
\`\`\`

\`dyld_log_hidden_once\` guarantees each hiding is logged exactly once.

## ObjC layer: scheme filtering and device spoofing

fishhook cannot touch ObjC methods; runtime swizzle is used (\`dh_swizzle\` wraps \`method_getImplementation\` + \`method_setImplementation\`):

- \`-[UIApplication canOpenURL:]\`: parse the scheme; return NO on \`cydia\` etc.;
- \`-[UIDevice systemVersion]\` / \`-[UIDevice name]\` / \`-[UIDevice identifierForVendor]\`: return configured values;
- \`-[NSProcessInfo operatingSystemVersion]\`: configured value;
- \`-[ASIdentifierManager advertisingIdentifier]\`: configured UUID.

Every swizzle is guarded by "empty config → pass through the original"—spoofing is **optional**; no config, no intervention.

## Anti-debugging: ptrace and sysctl

\`ptrace\` is hooked (\`hook_env\`); \`PT_DENY_ATTACH\` is intercepted directly. \`sysctl\` \`KERN_PROC_PID\` queries are logged, and the \`P_TRACED\` bit is cleared before the result returns when spoofing is on. The principle: make the **query** see "not debugged"—not make the debugger actually fail, which would advertise existence.

## Boundary: spoofing lives inside the process only

Every hiding acts on **this process's API return values**. Cross-app calls, system services and server-side profiling are unaffected. That is why we call it "in-process spoofing", not invisibility.`,
    },
  },
  {
    slug: 'network-capture-layers',
    date: '2026-08-04',
    title: '进程内抓包实现：三层 hook 的配对、兜底与去重',
    summary: '三个 NSURLSession completion 方法 swizzle 配对请求响应、resume 兜底 delegate 任务、associated object 去重、SSL_write/SSL_read 抓自带 TLS 明文，以及请求时刻锚点的设计。',
    content: `代理抓包要解决证书信任与 pinning；进程内抓包绕开这两座山——直接在 App 自己的调用链里取数据。实现分三层。

## 第一层：completion 回调配对

\`NSURLSession\` 的主流用法是 completion-handler。swizzle 三个建任务方法（在 shared session 的真实私有类上，custom session 同为该类）：

\`\`\`c
swz_instance(sc, @selector(dataTaskWithRequest:completionHandler:),           (IMP)swz_dtReqCH, ...);
swz_instance(sc, @selector(dataTaskWithURL:completionHandler:),               (IMP)swz_dtURLCH, ...);
swz_instance(sc, @selector(uploadTaskWithRequest:fromData:completionHandler:), (IMP)swz_upReqCH, ...);
\`\`\`

核心技巧是**包装 completion block**：包装块闭包里捕获了原方法的 \`request\` 参数——请求体、URL、headers 在响应到达时依然可读；响应到达后 \`data\` / \`response\` / \`error\` 参数就是响应体与状态码。请求↔响应在一条记录里天然配对：

\`\`\`c
DHDataCH wrapped = ^(NSData *data, NSURLResponse *resp, NSError *err) {
    net_log_pair(rc.HTTPMethod, rc.URL.absoluteString,
                 rc.allHTTPHeaderFields, rc.HTTPBody,
                 data, resp, err, cs, reqMs, reqTid);
    ch(data, resp, err);   // 原 block 照常执行，App 无感
};
\`\`\`

两个设计细节：

- **请求时刻锚点**：\`reqMs\` / \`reqTid\` 在**建任务时**记录（不是响应到达时）。慢请求用响应时刻做锚点会把关联的加解密事件推出时间窗——\`correlate_request\` 以请求时刻 ms 为锚聚合窗口内事件；
- **异常静默**：包装块内 \`@try/@catch\`，日志失败绝不影响原 block。

## 第二层：resume 兜底

delegate 型任务没有 completion block，请求只在 \`-[NSURLSessionTask resume]\` 可见。swizzle \`resume\`，从 \`task.currentRequest\` 取请求体。

与第一层的重复问题用 \`objc_setAssociatedObject\` 解决：completion 配对捕获的 task 打上 \`kDHNetHandled\` 标记，\`resume\` 里命中标记则跳过——一个任务只记一次。

## 第三层：SSL_write / SSL_read

App bundle 自带 OpenSSL/BoringSSL（不走系统 TLS）时，fishhook \`SSL_write\` / \`SSL_read\`：

\`\`\`c
static int hooked_SSL_write(void *ssl, const void *buf, int num) {
    if (num > 0 && buf && dh_capture_sub_enabled(DH_CAP_NETWORK))
        net_log(@"TLS", @"send", ...);
    return orig_SSL_write(ssl, buf, num);
}
\`\`\`

\`void *ssl\` 占位即可——只记字节流不解析会话。系统 TLS 不经 App 的 import slot，多不命中属正常；这一层是 best-effort。

## 捕获开关与记录格式

三层全部受 \`dh_capture_sub_enabled(DH_CAP_NETWORK)\` 开关控制，统一记入 \`DHCategoryNetwork\`。配对记录的 \`timestampMs\` / \`threadId\` 字段存**请求构建时刻**的值——这是跨事件关联的基础：一次登录请求的签名（crypto）、写 Keychain（keychain）会与网络记录落在同一时间窗，\`correlate_request\` 把三者串成一条因果链。`,
    en: {
      title: 'In-process capture internals: pairing, backstop and dedupe across three hook layers',
      summary: 'Three NSURLSession completion methods swizzled to pair request/response, resume backstopping delegate tasks, associated-object dedupe, SSL_write/SSL_read for bundled TLS plaintext, and the request-time anchor design.',
      content: `Proxy-based capture must solve certificate trust and pinning; in-process capture skips both—it takes data straight from the app's own call chain. The implementation has three layers.

## Layer 1: completion callback pairing

The mainstream \`NSURLSession\` usage is completion-handlers. Three task-creation methods are swizzled (on the real private class behind the shared session; custom sessions share it):

\`\`\`c
swz_instance(sc, @selector(dataTaskWithRequest:completionHandler:),           (IMP)swz_dtReqCH, ...);
swz_instance(sc, @selector(dataTaskWithURL:completionHandler:),               (IMP)swz_dtURLCH, ...);
swz_instance(sc, @selector(uploadTaskWithRequest:fromData:completionHandler:), (IMP)swz_upReqCH, ...);
\`\`\`

The core trick is **wrapping the completion block**: the wrapper's closure captures the original \`request\` argument—request body, URL and headers stay readable when the response arrives; \`data\` / \`response\` / \`error\` then yield the body and status. Request and response pair naturally within one record:

\`\`\`c
DHDataCH wrapped = ^(NSData *data, NSURLResponse *resp, NSError *err) {
    net_log_pair(rc.HTTPMethod, rc.URL.absoluteString,
                 rc.allHTTPHeaderFields, rc.HTTPBody,
                 data, resp, err, cs, reqMs, reqTid);
    ch(data, resp, err);   // original block runs as usual, app none the wiser
};
\`\`\`

Two design details:

- **Request-time anchor**: \`reqMs\` / \`reqTid\` are captured at **task creation** (not response time). Anchoring by response time would push correlated crypto events out of the window on slow requests—\`correlate_request\` aggregates same-window events by the request-time ms;
- **Silent failure**: the wrapper body is \`@try/@catch\`; logging must never affect the original block.

## Layer 2: resume backstop

Delegate-style tasks have no completion block; the request is only visible at \`-[NSURLSessionTask resume]\`. Swizzle \`resume\`, read \`task.currentRequest\`.

Dedupe against layer 1 uses \`objc_setAssociatedObject\`: tasks captured by completion pairing carry a \`kDHNetHandled\` mark; \`resume\` skips marked tasks—one task, one record.

## Layer 3: SSL_write / SSL_read

When the app bundles its own OpenSSL/BoringSSL (bypassing system TLS), fishhook \`SSL_write\` / \`SSL_read\`:

\`\`\`c
static int hooked_SSL_write(void *ssl, const void *buf, int num) {
    if (num > 0 && buf && dh_capture_sub_enabled(DH_CAP_NETWORK))
        net_log(@"TLS", @"send", ...);
    return orig_SSL_write(ssl, buf, num);
}
\`\`\`

A \`void *ssl\` placeholder suffices—log byte streams, never parse sessions. System TLS does not flow through the app's import slots, so misses are expected; this layer is best-effort.

## Capture gate and record format

All three layers honor \`dh_capture_sub_enabled(DH_CAP_NETWORK)\` and log into \`DHCategoryNetwork\`. The paired record's \`timestampMs\` / \`threadId\` store **request-build-time** values—the basis for cross-event correlation: one login request's signature (crypto) and Keychain write land in the same window as the network record, and \`correlate_request\` threads them into one causal chain.`,
    },
  },
  {
    slug: 'macho-dump-internals',
    date: '2026-08-04',
    title: '砸壳实现：Mach-O 重写、零依赖 zip 与异步任务模型',
    summary: 'cryptid 判定、按 load command 重排写回、__LINKEDIT 直拷、filesize 展开、查表法 CRC-32 的 zip 写入器，以及砸壳任务为什么必须离地执行。',
    content: `App Store 分发的二进制 \`__TEXT\` 段由 FairPlay 加密，\`LC_ENCRYPTION_INFO_64\` 标记 \`cryptid=1\`。但运行时内存里已经是明文——内核在映射代码页前完成了解密。砸壳本质是一个**导出过程**：把进程内已解密的 Mach-O 按规范重写回磁盘。

## 第一步：枚举镜像并判定可砸

注入的 dylib 与目标同进程，用 \`_dyld_image_count\` / \`_dyld_get_image_header\` 枚举已加载镜像，过滤出 App bundle 内的主程序与 Frameworks（排除系统库），读 \`LC_ENCRYPTION_INFO_64\` 确认 \`cryptid=1\` 才进入流程。\`dump_status\` 工具暴露同一份清单与异步任务状态。

## 第二步：按 load command 重排写回

进程内镜像经过 rebase 有 slide 偏移，不能整段 memcpy。正确做法是重新解析 Mach-O：

1. 复制文件头与全部 load commands；
2. 遍历除 \`__LINKEDIT\` 外的段，按 \`fileoff\` 把对应内存页写回（地址减去 slide 才是段在内存里的起点）；
3. \`__LINKEDIT\`（符号表、字符串表、dyld info）直接从原始文件复制——这部分在磁盘上本来就是明文；
4. 把 \`LC_ENCRYPTION_INFO_64\` 的 \`cryptid\` 改为 0，并把加密段的 \`filesize\` 展开为真实大小。

产物是干净镜像：可直接丢给 IDA / Ghidra / class-dump，或继续重签名安装。

## 第三步：零依赖 zip 打包 IPA

IPA 模式需要在设备端生成 zip。项目实现了零依赖 zip 写入器（\`zip_writer.c\`）：

- 手动构造 local file header / central directory / EOCD 三段结构；
- CRC-32 用查表法实现，与 \`zlib\` 的 \`crc32\` 语义一致（逐字节查 256 项表，多项式 0xEDB88320）；
- 只写入 \`Payload/App.app\` 下的必要条目；
- **跳过 \`SC_Info\`、\`FairPlay\` 等签名残渣**——避免重签工具被残留的加密元数据误导。

## 异步任务模型

砸壳在 \`dump_manager\` 中作为异步任务执行：\`start_dump\` 提交任务（可选裸 .decrypted 或 IPA 模式），\`dump_status\` 轮询进度。任务在专用队列上跑，不阻塞 HTTP 与 hook 线程——注入场景下任何长任务都必须离地执行。

## 边界

- \`PlugIns/*.appex\` 是独立进程，主进程未加载，砸不到；
- 按需触发：不点按钮就不执行，零额外开销；
- 仅限自有 App 或已获授权目标。
## zip 写入器的结构细节

零依赖 zip 的构造分三段：

- **local file header**：\`PK\x03\x04\` 魔数 + 版本 + 标志位 + 压缩方法（我们只用 \`0\`，即 STORE 不压缩）+ CRC-32 + 文件大小 + 文件名长度；内容紧随其后；
- **central directory**：\`PK\x01\x02\` 魔数，逐条目重复 header 信息并加本地偏移（\`offset of local header\`）——解压器靠它索引；
- **EOCD**：\`PK\x05\x06\` 魔数 + 条目数 + central directory 偏移与大小。

CRC-32 查表法：预计算 256 项表（多项式 \`0xEDB88320\`），每个字节做 \`table[(crc ^ byte) & 0xFF] ^ (crc >> 8)\`，与 zlib 逐字节结果一致。\`.zip\` 的 DOS 时间戳字段用固定值即可——解压工具不校验它。

## 判定"可砸"的细节

镜像过滤不止看 \`cryptid\`：

- 通过 \`_dyld_get_image_name\` 拿路径，要求落在主 bundle 的 \`Contents\` / \`Frameworks\` 目录内（或与主程序同目录的 .dylib）；
- 系统库（\`/usr/lib\`、\`/System/Library\`）即使被动态加载也不进列表——它们本就没有 FairPlay 加密，砸了无意义；
- \`cryptid=0\` 的镜像直接标"未加密"，不进入任务队列。

## 为什么 filesize 必须展开

加密段的 \`filesize\` 在磁盘上是**密文大小**（可能小于内存中的明文大小，且按页对齐）。直接照抄会导致产出的镜像段长度不对，静态分析器会读到截断的 \`__text\`。展开为真实大小后，\`LC_ENCRYPTION_INFO_64\` 与段表一致，IDA 才能完整分析。`,
    en: {
      title: 'Dump internals: Mach-O rewriting, zero-dependency zip and the async task model',
      summary: 'cryptid gating, load-command-honoring re-serialization, straight-copied __LINKEDIT, filesize expansion, the table-based CRC-32 zip writer, and why dump tasks must run off-thread.',
      content: `App Store binaries carry a FairPlay-encrypted \`__TEXT\` marked by \`LC_ENCRYPTION_INFO_64\` (\`cryptid=1\`). But runtime memory is already plaintext—the kernel decrypts code pages before mapping them. Dumping is essentially an **export**: re-serialize the in-memory decrypted Mach-O back to disk per spec.

## Step 1: enumerate images and decide dumpability

The injected dylib shares the target's process. Enumerate loaded images via \`_dyld_image_count\` / \`_dyld_get_image_header\`, keep only App Bundle binaries (main binary + Frameworks, excluding system libraries), and confirm \`cryptid=1\` via \`LC_ENCRYPTION_INFO_64\` before proceeding. \`dump_status\` exposes the same inventory and async task state.

## Step 2: re-serialize honoring load commands

In-memory images carry a rebase slide—no blind memcpy. The correct path:

1. Copy the file header and all load commands;
2. For every segment except \`__LINKEDIT\`, write pages back at \`fileoff\` (subtract the slide to find the segment's in-memory start);
3. Copy \`__LINKEDIT\` (symtab, string table, dyld info) straight from the file—it is plaintext on disk already;
4. Set \`cryptid=0\` in \`LC_ENCRYPTION_INFO_64\` and expand the encrypted segment's \`filesize\` to its real size.

The result is a clean image: ready for IDA / Ghidra / class-dump, or re-signing for installation.

## Step 3: zero-dependency zip for IPA mode

IPA packaging requires generating a zip on-device. The project ships a dependency-free writer (\`zip_writer.c\`):

- Manual construction of local file header / central directory / EOCD;
- Table-based CRC-32, semantics-compatible with \`zlib\`'s \`crc32\` (256-entry table, polynomial 0xEDB88320);
- Only essential \`Payload/App.app\` entries are written;
- **\`SC_Info\` and \`FairPlay\` residue are skipped** so re-signing tools are not misled by leftover encryption metadata.

## Async task model

Dumping runs as an async task in \`dump_manager\`: \`start_dump\` submits (bare .decrypted or IPA mode), \`dump_status\` polls progress. Tasks run on a dedicated queue, never blocking HTTP or hook threads—in an injected context every long operation must run off-thread.

## Boundaries

- \`PlugIns/*.appex\` run in separate processes—not loadable, not dumpable;
- On-demand: nothing runs until you press the button, zero overhead otherwise;
- Your own apps or authorized targets only.
## Zip writer structural details

The zero-dependency zip is built in three parts:

- **local file header**: \`PK\x03\x04\` magic + version + flags + method (we only use \`0\`, i.e. STORE, no compression) + CRC-32 + sizes + name length; content follows;
- **central directory**: \`PK\x01\x02\` magic, repeating per-entry header info plus the \`offset of local header\`—extractors index through it;
- **EOCD**: \`PK\x05\x06\` magic + entry count + central directory offset and size.

Table-based CRC-32: a precomputed 256-entry table (polynomial \`0xEDB88320\`), each byte does \`table[(crc ^ byte) & 0xFF] ^ (crc >> 8)\`—identical to zlib's per-byte result. The DOS timestamp field in \`.zip\` entries can be a fixed value; extractors do not validate it.

## "Dumpable" judgment details

Image filtering goes beyond \`cryptid\`:

- \`_dyld_get_image_name\` paths must fall inside the main bundle's \`Contents\` / \`Frameworks\` (or sit next to the main executable);
- System libraries (\`/usr/lib\`, \`/System/Library\`) never enter the list even when loaded—they carry no FairPlay encryption, dumping is pointless;
- \`cryptid=0\` images are marked "not encrypted" and skipped.

## Why filesize must be expanded

On disk, the encrypted segment's \`filesize\` is the **ciphertext size** (possibly smaller than in-memory plaintext, page-aligned). Copying it verbatim yields a truncated \`__text\` that static analyzers misread. Expanding to the real size keeps \`LC_ENCRYPTION_INFO_64\` consistent with the segment table, so IDA can analyze fully.`,
    },
  },
  {
    slug: 'mcp-static-analysis-tools',
    date: '2026-08-04',
    title: 'MCP 静态分析实现：vm 防护读取、xref 四件套与符号化',
    summary: 'vm_read_overwrite 的安全读取约定、bl 扫描 + import stub 还原、ADRP+ADD 字符串引用恢复、objc_msgSend selector 判定与函数级调用图。',
    content: `MCP 工具链里最硬核的部分是 xref 家族与符号化。难点不在反汇编本身，而在**运行时把地址还原成语义**。

## 安全读取：一切的前提

\`analyze_function\` / \`read_memory\` / \`search_memory\` 的读取全部走 \`vm_read_overwrite\`：

\`\`\`c
kern_return_t kr = vm_read_overwrite(mach_task_self(), addr, size, buf, &len);
if (kr != KERN_SUCCESS) return isError;   // 不可读页返回错误，绝不崩溃
\`\`\`

这是注入场景的底线：目标进程的任何内存地址都可能不可读，崩溃一次就是杀死宿主。

## disassemble：Capstone 集成

\`cs_open(CS_ARCH_ARM64, CS_MODE_ARM)\` 单次初始化，\`cs_disasm\` 逐指令出反汇编。\`disassemble_function\` 从运行时地址开始，遇 \`ret\` 或达到 \`max_bytes\` 停止——完整函数边界比固定长度更重要。

## find_xrefs：扫 bl，再解析 import stub

"谁调用了 CCCrypt"分两步：

1. 线性扫描目标镜像 \`__text\`，收集所有 \`bl\` / \`blx\` 指令的 target；
2. 若 target 落在 \`__la_symbol_ptr\` 区域，说明是对 import stub 的调用——从间接符号表取符号名，再用 \`dladdr\` 解析运行时地址得到真实符号。

调用点以 \`call_site\` + \`from_func\` 输出，\`from_func\` 由 \`dladdr\` 最近符号加偏移计算。

## find_string_refs：恢复 ADRP+ADD

arm64 上字符串引用不是立即数：

- **直接引用**：\`ADRP x0, page\` + \`ADD x0, x0, #off\`；
- **间接引用**：\`ADRP x0, page\` + \`LDR x0, [x0, #off]\`（指针槽）。

工具对每条指令解出目标地址，检查是否落在 \`__cstring\` / \`__cfstring\` 等字符串 section。\`find_selector_refs\` 同理但只报 \`objc_msgSend\` 的 call_site——selector 必须走消息发送才算"被使用"。

## find_function_refs：内部调用图

单镜像 \`__text\` 内 BL 边扫描，\`from_func → to_func\` 有向边，direction 支持 \`callers\` / \`callees\` / \`both\`。配合 \`list_functions\`（\`LC_FUNCTION_STARTS\`）可画出完整函数级调用图——strip 之后依然可用。

## 为什么可行

所有 xref 都基于运行时内存而非原始文件：

- 符号表、字符串表经 dyld rebase 后依然可解析；
- 反汇编结果是**真实加载地址**，可直接与 hook 事件、内存读取联动；
- 这正是"注入式分析"相对静态文件的优势：看到的就是它跑的样子。
## 完整工具面：11 个分析工具

\`tools/list\` 暴露的静态分析面按 tier 组织：

| tier | 工具 | 用途 |
|---|---|---|
| tier-0 | \`disassemble\` / \`analyze_function\` | hex 字节 / 进程内存反汇编 |
| tier-0 | \`get_macho_info\` | 镜像清单：load_address、cryptid、加密状态 |
| tier-0 | \`list_imports\` | 镜像导入符号（fishhook 候选） |
| tier-1 | \`find_xrefs\` | 谁调用目标符号/地址 |
| tier-2A | \`find_string_refs\` | 谁引用该字符串 |
| tier-2B | \`find_selector_refs\` | 谁把这个 selector 发消息 |
| tier-3A | \`find_function_refs\` | 内部调用图（callers/callees/both） |
| tier-3B | \`list_functions\` | LC_FUNCTION_STARTS 函数清单 |
| tier-4 | \`objc_resolve_imp\` | selector → 运行时真实 IMP |
| analysis | \`resolve_symbol\` / \`symbolicate\` | dlsym 符号化 / dladdr 符号化 |

tier 编号同时表达了依赖关系：xref 类工具依赖 \`get_macho_info\` 提供的 load_address 起点。

## hexdump 与字节工具

\`read_memory\` 返回 Hex、ASCII 与 HexDump 三列（偏移 6 位十六进制 + 16 字节分组 + ASCII 还原），十六进制与文本之间双向可译——检查 Key、常量与结构体时无需另开工具。

## 为什么运行时 xref 优于静态文件

静态分析器对 strip 过的二进制只能还原地址；运行时有三个额外信息源：

1. dyld 已完成 rebase 与 bind——GOT 里是**真实地址**；
2. \`dladdr\` 把地址映射回镜像与最近符号；
3. \`objc_resolve_imp\` 直接回答"这个 selector 实际执行的是哪段代码"。

三者叠加，xref 的答案从"0x1029ac000"变成"\`-[SessionCipher encrypt:]\` + 0x88"，语义完整。`,
    en: {
      title: 'MCP static analysis internals: guarded reads, the xref family and symbolication',
      summary: 'The vm_read_overwrite safe-read contract, bl scanning with import stub resolution, ADRP+ADD string reference recovery, objc_msgSend selector judgment and function-level call graphs.',
      content: `The hardest part of the MCP toolchain is the xref family and symbolication. The difficulty is not disassembly itself—it is **turning runtime addresses into semantics**.

## Safe reads: the precondition for everything

\`analyze_function\` / \`read_memory\` / \`search_memory\` all read through \`vm_read_overwrite\`:

\`\`\`c
kern_return_t kr = vm_read_overwrite(mach_task_self(), addr, size, buf, &len);
if (kr != KERN_SUCCESS) return isError;   // unreadable page returns an error, never crashes
\`\`\`

This is the baseline of injected code: any address in the target process may be unreadable, and a single crash kills the host.

## disassemble: Capstone integration

\`cs_open(CS_ARCH_ARM64, CS_MODE_ARM)\` initializes once; \`cs_disasm\` emits per-instruction disassembly. \`disassemble_function\` starts at a runtime address and stops at \`ret\` or \`max_bytes\`—whole function boundaries beat fixed lengths.

## find_xrefs: scan bl, then resolve import stubs

"Who calls CCCrypt" is two steps:

1. Linearly scan the target image's \`__text\`, collecting targets of every \`bl\` / \`blx\`;
2. If the target lands in \`__la_symbol_ptr\`, it is a call to an import stub—resolve the symbol from the indirect symbol table, then \`dladdr\` the runtime address for the real symbol.

Call sites are reported as \`call_site\` + \`from_func\`, where from_func is the nearest \`dladdr\` symbol plus offset.

## find_string_refs: recovering ADRP+ADD

On arm64, string references are not immediates:

- **Direct**: \`ADRP x0, page\` + \`ADD x0, x0, #off\`;
- **Indirect**: \`ADRP x0, page\` + \`LDR x0, [x0, #off]\` (pointer slot).

The tool resolves each instruction's target and checks string sections like \`__cstring\` / \`__cfstring\`. \`find_selector_refs\` analogously reports only \`objc_msgSend\` call sites—a selector counts as "used" only through message dispatch.

## find_function_refs: internal call graph

BL-edge scanning within one image's \`__text\` produces directed \`from_func → to_func\` edges; direction supports \`callers\` / \`callees\` / \`both\`. Combined with \`list_functions\` (\`LC_FUNCTION_STARTS\`), a full function-level call graph is available—even after stripping.

## Why this works

Every xref is based on runtime memory, not the raw file:

- Symbol and string tables remain resolvable after dyld's rebase;
- Disassembly results are **real load addresses**, directly linkable to hook events and memory reads;
- This is the injection model's edge over static files: you see exactly what it runs like.
## Full tool surface: 11 analysis tools

The static analysis surface exposed by \`tools/list\` is tiered:

| tier | tool | purpose |
|---|---|---|
| tier-0 | \`disassemble\` / \`analyze_function\` | hex bytes / process-memory disassembly |
| tier-0 | \`get_macho_info\` | image inventory: load_address, cryptid, encryption status |
| tier-0 | \`list_imports\` | image imports (fishhook candidates) |
| tier-1 | \`find_xrefs\` | who calls the target symbol/address |
| tier-2A | \`find_string_refs\` | who references this string |
| tier-2B | \`find_selector_refs\` | who sends this selector |
| tier-3A | \`find_function_refs\` | internal call graph (callers/callees/both) |
| tier-3B | \`list_functions\` | LC_FUNCTION_STARTS listing |
| tier-4 | \`objc_resolve_imp\` | selector → real runtime IMP |
| analysis | \`resolve_symbol\` / \`symbolicate\` | dlsym / dladdr symbolication |

Tier numbers also encode dependency: xref tools need \`get_macho_info\`'s load_address as their starting point.

## hexdump and byte tools

\`read_memory\` returns Hex, ASCII and HexDump columns (6-digit offset + 16-byte groups + ASCII projection), with hex/text interconversion—inspecting keys, constants and structs needs no extra tool.

## Why runtime xref beats static files

For stripped binaries, static analyzers can only restore addresses; runtime has three extra information sources:

1. dyld has already rebased and bound—GOT entries hold **real addresses**;
2. \`dladdr\` maps addresses back to images and nearest symbols;
3. \`objc_resolve_imp\` directly answers "which code does this selector actually execute".

Combined, xref answers go from "0x1029ac000" to "\`-[SessionCipher encrypt:]\` + 0x88"—full semantics.`,
    },
  },
];

