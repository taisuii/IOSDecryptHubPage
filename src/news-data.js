// 技术文章（news）数据源。
// 每篇文章携带中英文双语内容：title/summary/content + en.title/en.summary/en.content。
// 新增文章：复制一个对象追加到数组即可，slug 需唯一。content 为 markdown。

export const NEWS_ARTICLES = [
  {
    slug: 'fishhook-got-rebinding',
    date: '2026-08-04',
    title: 'fishhook 的实现：重绑定 GOT 的两个细节',
    summary: '不改指令，只改指针。本文拆解 fishhook 重绑定间接符号表的完整链路：镜像加载回调、懒/非懒符号指针、以及为什么必须额外钩住 dlsym。',
    content: `fishhook 是 iOS 免越狱注入的事实标准。它不改指令，只改**指针**——具体来说，改的是 Mach-O 的间接符号表（indirect symbol table）。

## 动态符号在内存中的三张表

进程启动后 dyld 完成 rebase 与 bind，符号指针落在 \`__DATA\` 段的两个 section：

- \`__la_symbol_ptr\`（懒符号指针）：首次调用时才解析，未解析前指向 \`dyld_stub_binder\`；
- \`__nl_symbol_ptr\`（非懒符号指针）：启动时解析完成。

两个表的每一项都通过 \`LC_DYLD_INFO_ONLY\` 中的 indirectsymtab（间接符号表）映射到 symtab 里的符号下标。fishhook 的动作就是：找到目标符号的间接符号表下标，把对应表项的值改成 wrapper 地址。

## 时机：\_dyld_register_func_for_add_image

难点在于镜像可能早已加载完成、GOT 已被 dyld 填成真实地址。fishhook 的做法是：

\`\`\`c
_dyld_register_func_for_add_image(rebind_symbols_for_image);
\`\`\`

这个 API 会立即对**所有已加载镜像**回调一次，之后每个新镜像加载时再回调。每次回调中：

1. 遍历镜像 \`__DATA\` 段的 \`__nl_symbol_ptr\` 与 \`__la_symbol_ptr\`；
2. 用 \`getsectbynamefromheader\` 取 section 的 vmaddr 偏移；
3. 对每个表项查 indirectsymtab，得到 symtab 下标；
4. 由 \`symtab + nlist\` 的 \`n_un.n_strx\` 解析符号名并与目标比对；
5. 命中后把表项写为 wrapper 地址。

懒符号表未解析时存的是 \`dyld_stub_binder\` 的地址，rebind 后不再触发 binder——因为表项已被我们替换，binder 永无机会写入真实地址。

## 为什么必须额外钩住 dlsym

fishhook 只改**已经（或即将）通过表项解析**的调用。如果目标代码用 \`dlsym(RTLD_DEFAULT, "CCCrypt")\` 动态取地址，直接绕过了 GOT，fishhook 拦不住。因此项目对已 hook 符号额外钩住 \`dlsym\`：解析到已 hook 符号时返回 wrapper 地址，堵死这条函数指针旁路。

## 边界

- 依赖镜像已加载、表项可写；
- 改的是绑定而非指令，\`__TEXT\` 的代码签名不受影响；
- 只能拦"符号级"调用，拦不了手工内联汇编与加密内联实现。`,
    en: {
      title: 'How fishhook works: two details of GOT rebinding',
      summary: 'Change pointers, not instructions. This post walks through the full rebinding pipeline: image-load callbacks, lazy/non-lazy symbol pointers, and why hooking dlsym is mandatory.',
      content: `fishhook is the de-facto standard for jailbreak-free injection on iOS. It does not patch instructions—it patches **pointers**, specifically the Mach-O indirect symbol table.

## Three tables behind dynamic symbols

After launch, dyld rebases and binds, and symbol pointers land in two \`__DATA\` sections:

- \`__la_symbol_ptr\` (lazy): resolved on first call; points at \`dyld_stub_binder\` until then;
- \`__nl_symbol_ptr\` (non-lazy): resolved at startup.

Each entry is mapped to a symtab index via the indirect symbol table from \`LC_DYLD_INFO_ONLY\`. fishhook finds the target's index and overwrites the entry with a wrapper address.

## Timing: \_dyld_register_func_for_add_image

The tricky part: images may already be loaded with a fully-bound GOT. fishhook registers:

\`\`\`c
_dyld_register_func_for_add_image(rebind_symbols_for_image);
\`\`\`

This fires immediately for every loaded image, and again on each future load. Per image:

1. Walk \`__nl_symbol_ptr\` and \`__la_symbol_ptr\` in \`__DATA\`;
2. Locate the sections via \`getsectbynamefromheader\` (vmaddr offset);
3. Resolve each entry to a symtab index through indirectsymtab;
4. Compare the symbol name resolved from \`symtab + nlist\` via \`n_un.n_strx\`;
5. On hit, write the wrapper address.

An unresolved lazy entry holds \`dyld_stub_binder\`; after rebind the binder never runs, because our pointer is already there.

## Why hooking dlsym is mandatory

fishhook only intercepts calls that flow through table entries. Code using \`dlsym(RTLD_DEFAULT, "CCCrypt")\` bypasses the GOT entirely. So the project hooks \`dlsym\` too: any lookup of an already-hooked symbol returns the wrapper, closing the function-pointer bypass.

## Boundaries

- Requires loaded images with writable entries;
- Rebinds bindings, not instructions—\`__TEXT\` code signatures stay valid;
- Only symbol-level calls are intercepted; hand-written inline assembly is out of scope.`,
    },
  },
  {
    slug: 'fairplay-in-memory-dump',
    date: '2026-08-02',
    title: '砸壳实现：把内核解密过的内存写回磁盘',
    summary: 'FairPlay 加密的 __TEXT 在运行时已被内核解密。砸壳不是"破解"，而是把这段已解密内存按 Mach-O 结构写回，并修正 cryptid。',
    content: `App Store 分发的二进制，\`__TEXT\` 段由 FairPlay 加密，\`LC_ENCRYPTION_INFO_64\` 标记 \`cryptid=1\`。但**运行时的内存里已经是明文**——内核在把代码页映射进进程前完成了解密。砸壳做的事本质上是一个"导出"过程。

## 起点：内核已解密

注入的 dylib 与目标 App 在同一进程，读取自身进程的 \`__TEXT\` 就是读明文。所以脱壳的第一步不是解密，而是：

1. 用 \`_dyld_image_count\` / \`_dyld_get_image_header\` 枚举已加载镜像；
2. 过滤出 App bundle 内的主程序与 Frameworks（排除系统库）；
3. 读 \`LC_ENCRYPTION_INFO_64\` 确认 \`cryptid=1\` 才进入脱壳流程。

## 写回：按 load command 重排

进程内的镜像布局经过 rebase 后有 slide 偏移，不能整段 memcpy 了事。正确做法是重新解析 Mach-O：

- 复制文件头与所有 load commands；
- 遍历 \`__LINKEDIT\` 之外的段，按 \`fileoff\` 写回对应内存页（减去 slide）；
- \`__LINKEDIT\`（符号表、字符串表、dyld info）直接从原始文件复制；
- 最后把 \`LC_ENCRYPTION_INFO_64\` 的 \`cryptid\` 改为 0，并把加密段的 \`filesize\` 展开为真实大小。

产物是一份干净镜像：可直接丢给 IDA / Ghidra / class-dump，或重新签名安装。

## 打包 IPA 的零依赖 zip

若选择 IPA 模式，需要在设备端生成 zip。项目实现了零依赖的 zip 写入器：

- 手动构造 local file header / central directory / EOCD；
- CRC-32 用查表法实现，与 \`zlib\` 的 \`crc32\` 语义一致；
- 只写入 \`Payload/App.app\` 与 \`Info.plist\` 等必要条目；
- 跳过 \`SC_Info\`、\`FairPlay\` 等签名残渣，避免重签时误导工具。

## 边界

- \`PlugIns/*.appex\` 是独立进程，主进程未加载，砸不到；
- 按需触发：不点按钮就不执行，零额外开销；
- 仅限自有 App 或已获授权的目标。`,
    en: {
      title: 'In-memory dump: writing kernel-decrypted memory back to disk',
      summary: 'FairPlay-encrypted __TEXT is already plaintext at runtime. Dumping is an export, not a crack: re-serialize the decrypted Mach-O and fix cryptid.',
      content: `App Store binaries carry FairPlay-encrypted \`__TEXT\` marked by \`LC_ENCRYPTION_INFO_64\` (\`cryptid=1\`). But at **runtime the memory is already plaintext**—the kernel decrypts code pages before mapping them. Dumping is essentially an export.

## Starting point: kernel-decrypted memory

The injected dylib lives in the same process, so reading \`__TEXT\` reads plaintext. The dump flow:

1. Enumerate loaded images with \`_dyld_image_count\` / \`_dyld_get_image_header\`;
2. Keep only App Bundle binaries (main binary + Frameworks), excluding system libraries;
3. Confirm \`cryptid=1\` via \`LC_ENCRYPTION_INFO_64\` before proceeding.

## Re-serializing: honor the load commands

In-memory layout carries a rebase slide—no blind memcpy. The correct path:

- Copy the file header and all load commands;
- For every segment except \`__LINKEDIT\`, write pages back at \`fileoff\` (minus slide);
- Copy \`__LINKEDIT\` (symtab, string table, dyld info) straight from the file;
- Finally set \`cryptid=0\` and expand the encrypted segment's \`filesize\` to the real size.

The result is a clean image: ready for IDA / Ghidra / class-dump, or re-signing for installation.

## Zero-dependency zip writer for IPA mode

On-device IPA packaging requires generating a zip. The project ships a dependency-free writer:

- Manual construction of local file header / central directory / EOCD;
- Table-based CRC-32, semantics-compatible with \`zlib\`'s \`crc32\`;
- Only essential entries: \`Payload/App.app\`, \`Info.plist\`, etc.;
- \`SC_Info\` and \`FairPlay\` residue skipped, so re-signing tools are not confused.

## Boundaries

- \`PlugIns/*.appex\` run in separate processes—not loadable, not dumpable;
- On-demand: nothing runs until you press the button, zero overhead otherwise;
- Your own apps or authorized targets only.`,
    },
  },
  {
    slug: 'capstone-xref-implementation',
    date: '2026-07-28',
    title: 'MCP 静态分析：Capstone 与 xref 四件套的实现',
    summary: 'disassemble、find_xrefs、find_string_refs、find_selector_refs、find_function_refs 如何在运行时重建调用关系：bl 扫描、ADRP+ADD 恢复、dladdr 符号化。',
    content: `进程内 MCP 服务器暴露 Capstone 反汇编与 xref 系列工具。难点不在于反汇编本身，而在于**在运行时把地址还原成语义**。

## 反汇编：内存安全优先

\`analyze_function\` 从运行时地址开始读 \`__text\`：

\`\`\`c
vm_read_overwrite(mach_task_self(), addr, buf, size, &len);
\`\`\`

不可读页返回 \`isError\` 而不是崩溃——这条"不崩溃原则"是注入场景的底线。遇到 \`ret\` 或达到 \`max_bytes\` 停止，保证完整函数边界。

## find_xrefs：扫 bl，再解析 import stub

"谁调用了 CCCrypt"分两步：

1. 线性扫描目标镜像 \`__text\`，收集所有 \`bl\` / \`blx\` 指令的 target；
2. 若 target 落在 \`__la_symbol_ptr\` 区域，说明这是对 import stub 的调用——从间接符号表取符号名，再用 \`dladdr\` 解析运行时地址得到真实符号。

调用点最终以 \`call_site\` + \`from_func\` 形式给出，from_func 由 \`dladdr\` 返回的最近符号（如 \`-[SessionCipher encrypt:]\`）加偏移计算。

## find_string_refs：恢复 ADRP+ADD

字符串引用在 arm64 上不是立即数，而是：

- **直接引用**：\`ADRP x0, page\` + \`ADD x0, x0, #off\`；
- **间接引用**：\`ADRP x0, page\` + \`LDR x0, [x0, #off]\`（指针槽）。

工具对每条指令解出目标地址，检查是否落在 \`__cstring\` / \`__cfstring\` 等字符串 section，命中则记录引用点与字符串内容。同理 \`find_selector_refs\` 只报 \`objc_msgSend\` 的 \`call_site\`——selector 必须走消息发送才算"被使用"。

## find_function_refs：内部调用图

在单个镜像 \`__text\` 内做 BL 边扫描，\`from_func → to_func\` 有向边，direction 支持 \`callers\` / \`callees\` / \`both\`，配合 \`list_functions\`（\`LC_FUNCTION_STARTS\`）可以画出完整的函数级调用图——strip 之后依然可用。

## 为什么可行

所有 xref 都基于运行时内存而非原始文件：

- 符号表、字符串表经 dyld 的 rebase 后依然可解析；
- 反汇编结果是**真实加载地址**，可直接与 hook 事件、内存读取联动；
- 这正是"注入式分析"相对静态文件的优势：看到的就是它跑的样子。`,
    en: {
      title: 'MCP static analysis: Capstone and the xref family',
      summary: 'How disassemble, find_xrefs, find_string_refs, find_selector_refs and find_function_refs rebuild call relationships at runtime: bl scanning, ADRP+ADD recovery and dladdr symbolication.',
      content: `The in-process MCP server exposes Capstone disassembly and the xref family. The hard part is not disassembling—it is turning raw addresses into **semantics at runtime**.

## Disassembly: memory safety first

\`analyze_function\` reads \`__text\` from a runtime address:

\`\`\`c
vm_read_overwrite(mach_task_self(), addr, buf, size, &len);
\`\`\`

Unreadable pages return \`isError\` instead of crashing—the no-crash rule is the baseline for injected code. Scanning stops at \`ret\` or \`max_bytes\` to keep whole function boundaries.

## find_xrefs: scan bl, then resolve import stubs

"Who calls CCCrypt" is two steps:

1. Linearly scan the target image's \`__text\`, collecting targets of every \`bl\` / \`blx\`;
2. If the target lands in \`__la_symbol_ptr\`, it is a call to an import stub—resolve the symbol name from the indirect symbol table, then \`dladdr\` the runtime address for the real symbol.

Call sites are reported as \`call_site\` + \`from_func\`, where from_func is the nearest symbol from \`dladdr\` (e.g. \`-[SessionCipher encrypt:]\`) plus offset.

## find_string_refs: recovering ADRP+ADD

On arm64, string references are not immediates:

- **Direct**: \`ADRP x0, page\` + \`ADD x0, x0, #off\`;
- **Indirect**: \`ADRP x0, page\` + \`LDR x0, [x0, #off]\` (pointer slot).

The tool resolves each instruction's target address and checks string sections like \`__cstring\` / \`__cfstring\`; on hit it records the ref site and content. \`find_selector_refs\` analogously reports only \`objc_msgSend\` call sites—a selector counts as "used" only when it goes through message dispatch.

## find_function_refs: internal call graph

BL-edge scanning within one image's \`__text\` produces directed \`from_func → to_func\` edges; direction supports \`callers\` / \`callees\` / \`both\`. Combined with \`list_functions\` (\`LC_FUNCTION_STARTS\`), a full function-level call graph is available—even after stripping.

## Why this works

Every xref is based on runtime memory, not the raw file:

- Symbol and string tables remain resolvable after dyld's rebase;
- Disassembly results are **real load addresses**, directly linkable to hook events and memory reads;
- This is the injection model's edge over static files: you see exactly what it runs like.`,
    },
  },
  {
    slug: 'udp-beacon-vs-bonjour',
    date: '2026-07-25',
    title: '设备发现：为什么是 UDP 信标而不是 Bonjour',
    summary: '注入场景无法控制宿主 App 的 Info.plist，Bonjour 注册会静默失败。UDP 广播信标零声明、零依赖，把存在性广播到局域网。',
    content: `设备发现是所有注入式工具的第一步。两条候选路线：Bonjour/mDNS 与自研 UDP 信标。最终选择信标，理由很工程化。

## Bonjour 的三重约束

1. **依赖 Info.plist**：注册 \`NSBonjourServices\` 需要宿主 App 声明。但 dylib 注入的是**别人的 App**，你无法控制它的 plist；注入器（TrollFools 等）也不保证帮你合并这两个键；
2. **静默失败**：声明缺失时注册失败且无任何日志，排查成本极高；
3. **跨层依赖**：需要 Bonjour 守护进程与完整 mDNS 栈，对注入进程是额外暴露面。

## UDP 信标的设计

\`idh\` 的发现层改为 UDP 广播：

- 插件启动 HTTP 服务后，向 255.255.255.255:8089 周期性广播信标；
- 信标 payload 含设备名、版本、HTTP 端口（8088）与进程信息；
- PC 端 \`idh --devices\` 监听广播，即可发现设备并弹出候选列表。

无需任何 plist 声明、无需 entitlement、无需守护进程。注入即可用。

## 代价与对策

广播会到达同一局域网内的无关设备——调试工具的语义下完全可接受。为避免噪音：

- 信标包极小（几百字节内），不携带任何业务数据；
- 仅 UDP 8089 承担"存在性广播"，业务全走 HTTP 8088，监听端口保持最小暴露面；
- 配合 HTTP 侧的 CORS 与设备名展示，误连时用户一眼可辨。

## 结论

> 在无法控制宿主环境的注入场景里，越简单的协议越可靠。声明式服务发现（Bonjour）很好，但它假设你能改 Info.plist——注入模型不满足这个前提。`,
    en: {
      title: 'Device discovery: UDP beacons over Bonjour',
      summary: 'Injection cannot control the host app\u2019s Info.plist, so Bonjour registration fails silently. A UDP broadcast beacon needs zero declarations and zero dependencies.',
      content: `Device discovery is the first step for any injection-based tool. Two candidates: Bonjour/mDNS and a homegrown UDP beacon. We chose the beacon, for very pragmatic reasons.

## Bonjour's three constraints

1. **Info.plist dependency**: registering \`NSBonjourServices\` requires a declaration from the host app. But the dylib is injected into **someone else's app**—you cannot touch its plist, and injectors (TrollFools etc.) do not guarantee merging those keys;
2. **Silent failure**: without the declaration, registration fails with no log whatsoever. Debugging cost is enormous;
3. **Cross-layer dependency**: Bonjour needs the daemon and full mDNS stack—extra attack surface inside an injected process.

## The UDP beacon design

\`idh\` discovery is plain UDP broadcast:

- Once the HTTP server is up, the plugin periodically broadcasts to 255.255.255.255:8089;
- The beacon carries device name, version, HTTP port (8088) and process info;
- The PC side (\`idh --devices\`) listens for broadcasts and lists discovered devices.

No plist declarations, no entitlements, no daemon. Works immediately after injection.

## Cost and mitigations

Broadcasts reach unrelated devices on the LAN—acceptable under debug-tool semantics. To keep it tidy:

- Beacons are tiny (a few hundred bytes) and carry zero business data;
- Only UDP 8089 advertises presence; all business traffic goes over HTTP 8088, keeping the listening surface minimal;
- Combined with CORS and a readable device name on the HTTP side, a wrong connection is obvious at a glance.

## Conclusion

> In injection scenarios where you cannot control the host environment, the simplest protocol wins. Declarative discovery (Bonjour) is great—but it assumes you can edit Info.plist. Injection does not meet that precondition.`,
    },
  },
];
