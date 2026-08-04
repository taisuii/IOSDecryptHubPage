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
    slug: 'crypto-hook-implementation',
    date: '2026-08-04',
    title: '算法的 Hook：从 CCCrypt 到流式会话与参数解析',
    summary: '摘要、对称、非对称、KDF 的 hook 不只是 rebind 符号——难点在把 C 参数翻译成语义：算法枚举、模式、填充，以及把 Init/Update/Final 拼回一条完整记录。',
    content: `加解密 hook 的技术含量不在"改指针"，而在**把 C 参数翻译成语义**。

## 一次性调用：CCCrypt

\`CCCrypt\` 一次调用完成整个加解密，参数全在寄存器与栈上：

\`\`\`c
CCCryptorStatus CCCrypt(
    CCOperation op,        // 0=encrypt 1=decrypt
    CCAlgorithm alg,       // kCCAlgorithmAES=0, DES=1, 3DES=2...
    CCOptions options,     // kCCOptionPKCS7Padding | kCCOptionECBMode
    const void *key, size_t keyLen,
    const void *iv,
    const void *dataIn, size_t dataInLength,
    void *dataOut, size_t dataOutLength, size_t *dataOutMoved);
\`\`\`

hook 函数拿到后：

1. \`op\` + \`alg\` + \`keyLen\` → "AES-256-CBC" / "DES-ECB" 这类可读名称（keyLen 决定密钥位数，\`options & kCCOptionECBMode\` 决定模式）；
2. \`key\` / \`iv\` 指针在加解密**前**读——明文还在缓冲区里；
3. 调原函数，解密场景下输出缓冲区就是明文；
4. 附上调用栈（回溯 \`pthread_backtrace\` 过滤系统帧）。

## 流式会话：Create → Update → Final

一次 API 搞不定大文件时 App 会走 \`CCCryptorCreate/Update/Final/Release\`。四条独立调用，中间只隔一个 \`CCCryptorRef\` 不透明指针。hook 需要自己维护会话表：

- \`CCCryptorCreate\` / \`CreateWithMode\`：以 \`cryptorRef\` 为 key 建会话，记算法、模式、key、iv；
- \`CCCryptorUpdate\`：把 \`dataIn\` 追加进会话缓冲区，**不立即落记录**（分片没意义）；
- \`CCCryptorFinal\`：拼出完整明文/密文，此时才输出一条完整记录；
- \`CCCryptorRelease\`：清会话。

会话表必须处理两个 edge case：Update 多次后 Final 的拼装顺序，以及**永不 Final 的会话**——长期持有 \`cryptorRef\` 的状态泄漏，靠 Release 钩子回收。

## SecKey：从 CFDictionary 里抠算法

非对称走 \`SecKeyCreateSignature\`，算法藏在一个 CFDictionary 里：

\`\`\`c
CFDictionaryRef algorithm = CFDictionaryCreate(...,
    kSecAttrKeyType, kSecAttrKeyTypeRSA,
    kSecAttrKeySizeInBits, ...);
SecKeyCreateSignature(key, algorithm, data, &err);
\`\`\`

hook 后要 \`CFDictionaryGetValue\` 逐个取 \`kSecAttrKeyType\` / \`kSecAttrKeySizeInBits\`，拼出 "RSA-2048 PKCS1v15-SHA256" 这类 algid；签名/加密结果在输出指针里，明文输入可以直接拿到。

## EVP：读结构体

目标链接 libcrypto 时走 OpenSSL EVP。\`EVP_CipherUpdate\` 的上下文是 \`EVP_CIPHER_CTX\` 结构体，算法藏在 \`cipher\` 字段的 \`EVP_CIPHER\` 里——\`EVP_CIPHER_nid\` 拿 NID，再映射成算法名。AEAD（AES-GCM/ChaCha20-Poly1305）还有 \`EVP_CIPHER_CTX_ctrl\` 的 AAD/tag 设置，需要单独捕获。

## 与 dlsym 重定向联动

fishhook 只改 GOT 表项。目标若用 \`dlsym(RTLD_DEFAULT, "CCCrypt")\` 动态取址会绕过表项——因此 \`dlsym\` 也被 hook：解析到已 hook 符号时返回 wrapper。两层拼起来，符号级调用全覆盖。`,
    en: {
      title: 'Hooking crypto: from CCCrypt to streaming sessions and parameter parsing',
      summary: 'Hooking digest/symmetric/asymmetric/KDF is not just rebinding symbols—the hard part is translating C parameters into semantics: algorithm enums, modes, padding, and stitching Init/Update/Final into one record.',
      content: `The real content of a crypto hook is not "patching pointers"—it is **translating C parameters into semantics**.

## One-shot: CCCrypt

\`CCCrypt\` performs a full operation in one call, with every parameter on the stack:

\`\`\`c
CCCryptorStatus CCCrypt(
    CCOperation op,        // 0=encrypt 1=decrypt
    CCAlgorithm alg,       // kCCAlgorithmAES=0, DES=1, 3DES=2...
    CCOptions options,     // kCCOptionPKCS7Padding | kCCOptionECBMode
    const void *key, size_t keyLen,
    const void *iv,
    const void *dataIn, size_t dataInLength,
    void *dataOut, size_t dataOutLength, size_t *dataOutMoved);
\`\`\`

Inside the hook:

1. \`op\` + \`alg\` + \`keyLen\` → a readable name like "AES-256-CBC" / "DES-ECB" (keyLen fixes the key size; \`options & kCCOptionECBMode\` fixes the mode);
2. Read \`key\` / \`iv\` **before** the operation—plaintext is still in the buffers;
3. Call the original; on decrypt, the output buffer is the plaintext;
4. Attach a call stack (backtrace filtered of system frames).

## Streaming sessions: Create → Update → Final

For large payloads apps use \`CCCryptorCreate/Update/Final/Release\`—four separate calls joined only by an opaque \`CCCryptorRef\`. The hook maintains its own session table:

- \`CCCryptorCreate\` / \`CreateWithMode\`: create a session keyed by \`cryptorRef\`, recording algorithm, mode, key and iv;
- \`CCCryptorUpdate\`: append \`dataIn\` to the session buffer—do **not** log yet (a chunk alone is meaningless);
- \`CCCryptorFinal\`: reassemble the full plaintext/ciphertext; only now emit one complete record;
- \`CCCryptorRelease\`: drop the session.

Two edge cases matter: ordering when Update runs multiple times before Final, and **sessions that never Final**—a leak of long-lived \`cryptorRef\` state, reclaimed through the Release hook.

## SecKey: digging the algorithm out of a CFDictionary

Asymmetric goes through \`SecKeyCreateSignature\`, with the algorithm hidden in a CFDictionary:

\`\`\`c
CFDictionaryRef algorithm = CFDictionaryCreate(...,
    kSecAttrKeyType, kSecAttrKeyTypeRSA,
    kSecAttrKeySizeInBits, ...);
SecKeyCreateSignature(key, algorithm, data, &err);
\`\`\`

The hook pulls \`kSecAttrKeyType\` / \`kSecAttrKeySizeInBits\` via \`CFDictionaryGetValue\` to build an algid like "RSA-2048 PKCS1v15-SHA256"; the signature/encrypted output sits in the out-pointer, and the plaintext input is directly readable.

## EVP: reading structs

When the target links libcrypto, OpenSSL EVP is used. The context of \`EVP_CipherUpdate\` is an \`EVP_CIPHER_CTX\`; the algorithm lives in the \`cipher\` field's \`EVP_CIPHER\`—\`EVP_CIPHER_nid\` yields the NID, mapped back to a name. AEAD ciphers (AES-GCM / ChaCha20-Poly1305) add AAD/tag handling via \`EVP_CIPHER_CTX_ctrl\`, captured separately.

## Linking with dlsym redirection

fishhook only rewrites GOT entries. \`dlsym(RTLD_DEFAULT, "CCCrypt")\` bypasses them—so \`dlsym\` is hooked too: lookups of already-hooked symbols return the wrapper. Together the two layers cover every symbol-level call.`,
    },
  },
  {
    slug: 'jailbreak-detection-bypass',
    date: '2026-08-04',
    title: '越狱环境是什么隐藏的：检测面与进程内伪装',
    summary: '从文件系统探测、URL scheme、dylib 枚举到反调试——逐一列出越狱检测的攻击面，以及为什么"在进程内回答假答案"比"藏起自己"更可靠。',
    content: `"隐藏越狱"要做的不是藏起自己，而是**在检测点回答假答案**。先看 App 会怎么查。

## 检测的攻击面

1. **文件系统探测**：\`access("/var/jb")\`、\`stat("/bin/bash")\`、读 \`/private/var/tmp/cydia.log\`。rootless 越狱的根在 \`/var/jb\`，路径枚举是成本最低的检测；
2. **URL scheme**：\`[[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:@"cydia://"]]\`；
3. **dylib 枚举**：遍历 \`_dyld_image_count\` / \`_dyld_get_image_name\`，找 \`libjailbreak.dylib\`、\`Cephei\`、\`Choicy\`、\`DynamicLibraries\` 这类注入痕迹；
4. **沙箱逃逸探测**：\`fork()\` 返回值、\`/Applications\` 可写性；
5. **反调试**：\`sysctl(mib, 4, NULL, NULL, NULL, 0)\` 查 \`KERN_PROC\` 的 \`P_TRACED\` 标志——越狱工具常在进程上挂调试器。

## 回答假答案：文件系统

\`hook_file\` 拦截 \`access\` / \`stat\` / \`open\` 等，对黑名单路径（\`/var/jb\`、\`/bin/bash\`、\`/usr/lib/libjailbreak.dylib\`、\`cydia.log\`…）直接返回错误：

\`\`\`c
if (dh_spoof_jb_should_hide_path(path)) {
    errno = ENOENT;
    return -1;
}
\`\`\`

注意两条细节：

- **只对真实 App 代码生效**：hook 内部要跳过自身（\`dh_in_hook\` 防重入），否则 \`access\` 自己的配置文件也会被拦；
- **黑名单可运行时增删**：\`dh_spoof_jb_add_path\` 支持把新发现的检测路径加进去。

## 回答假答案：URL scheme 与镜像列表

ObjC 层 fishhook 改不了，用 runtime swizzle：

- \`-[UIApplication canOpenURL:]\`：解析 scheme，命中 \`cydia\` 等黑名单时返回 NO；
- 镜像枚举没有直接 hook 的系统 API——但注入痕迹本身是 dylib 加载产生的，靠 \`dlopen\` 钩子旁路：拦下对黑名单镜像的加载调用。

## 回答假答案：反调试

\`sysctl\` 的 \`KERN_PROC_PID\` 调用被 hook：\`P_TRACED\` 位清零后再返回给 App。这是"检测点回答假答案"的典型——不是让 \`ptrace\` 失败，而是让**查询**看到"没被调试"。

## 设备参数伪装

\`UIDevice.systemVersion\`、\`UIDevice.name\`、\`identifierForVendor\`、\`ASIdentifierManager.advertisingIdentifier\`、\`NSProcessInfo.operatingSystemVersion\`——全部 swizzle 成配置值。这类伪装用于对抗"设备画像"（指纹按型号/ID 关联多账号）。

## 边界

> 以上全部**仅作用于本进程内**。跨 App 调用、系统服务、服务端画像不受影响——伪装不是隐身，只是让检测方在进程内得不到真实答案。`,
    en: {
      title: 'What jailbreak hiding actually hides: detection surface and in-process spoofing',
      summary: 'From filesystem probes, URL schemes and dylib enumeration to anti-debugging—the jailbreak detection surface, and why answering fake answers in-process beats hiding yourself.',
      content: `"Hiding jailbreak" is not about hiding yourself—it is about **answering fake answers at the detection points**. First, how apps check.

## The detection surface

1. **Filesystem probes**: \`access("/var/jb")\`, \`stat("/bin/bash")\`, reading \`/private/var/tmp/cydia.log\`. On rootless jailbreaks the root is \`/var/jb\`; path enumeration is the cheapest check;
2. **URL schemes**: \`[[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:@"cydia://"]]\`;
3. **dylib enumeration**: walk \`_dyld_image_count\` / \`_dyld_get_image_name\` looking for \`libjailbreak.dylib\`, \`Cephei\`, \`Choicy\`, \`DynamicLibraries\`;
4. **Sandbox escape probes**: \`fork()\` return values, writable \`/Applications\`;
5. **Anti-debugging**: \`sysctl(mib, 4, NULL, NULL, NULL, 0)\` reading the \`P_TRACED\` flag of \`KERN_PROC\`—jailbreak tools often keep a debugger attached.

## Fake answers: filesystem

\`hook_file\` intercepts \`access\` / \`stat\` / \`open\`; for blacklisted paths (\`/var/jb\`, \`/bin/bash\`, \`/usr/lib/libjailbreak.dylib\`, \`cydia.log\`...) it fails immediately:

\`\`\`c
if (dh_spoof_jb_should_hide_path(path)) {
    errno = ENOENT;
    return -1;
}
\`\`\`

Two details:

- **Only real app code is affected**: the hook must skip itself (\`dh_in_hook\` guards re-entry), or it would block its own config files;
- **The blacklist is mutable at runtime**: \`dh_spoof_jb_add_path\` lets you add newly-discovered detection paths.

## Fake answers: URL schemes and image lists

fishhook cannot touch the ObjC layer, so runtime swizzle is used:

- \`-[UIApplication canOpenURL:]\`: parse the scheme; return NO when it hits \`cydia\` etc.;
- There is no single system API to hook for image enumeration—but injection traces are themselves produced by dlopen, so the \`dlopen\` hook intercepts loading of blacklisted images.

## Fake answers: anti-debugging

\`sysctl\` calls with \`KERN_PROC_PID\` are hooked: the \`P_TRACED\` bit is cleared before the result reaches the app. This is the classic "answer at the detection point"—not making \`ptrace\` fail, but making the **query** see "not debugged".

## Device parameter spoofing

\`UIDevice.systemVersion\`, \`UIDevice.name\`, \`identifierForVendor\`, \`ASIdentifierManager.advertisingIdentifier\`, \`NSProcessInfo.operatingSystemVersion\`—all swizzled to configured values, used against "device profiling" (fingerprinting accounts by model/ID).

## Boundaries

> Everything above **acts only within this process**. Cross-app calls, system services and server-side profiling are unaffected—spoofing is not invisibility; it just stops detectors from getting true answers inside the process.`,
    },
  },
  {
    slug: 'network-capture-inprocess',
    date: '2026-08-04',
    title: '怎么抓包的：进程内三层的明文抓取',
    summary: '不配代理、不装证书、不碰 pinning——在 NSURLSession completion 回调里配对请求与响应，用 resume 兜底 delegate 任务，再用 fishhook 抓自带 TLS 栈的明文。',
    content: `代理抓包要面对三座山：iOS 15+ 的全局代理配置、证书信任与 **pinning**。进程内抓包绕开全部三者——直接在 App 自己的调用链里取数据。

## 第一层：completion 回调配对（覆盖绝大多数 App）

\`NSURLSession\` 的主流用法是 completion-handler。swizzle 三个建任务方法：

\`\`\`c
-[NSURLSession dataTaskWithRequest:completionHandler:]
-[NSURLSession dataTaskWithURL:completionHandler:]
-[NSURLSession uploadTaskWithRequest:fromData:completionHandler:]
\`\`\`

技巧在包装 block：**在 block 里，原方法的 \`request\` 参数还在闭包里**——请求体、URL、headers 直接可读；响应到达时 \`data\` / \`response\` / \`error\` 参数就是响应体与状态码。于是请求↔响应天然配对成一条记录：

\`\`\`c
DHDataCH wrapped = ^(NSData *data, NSURLResponse *resp, NSError *err) {
    net_log_pair(rc.HTTPMethod, rc.URL.absoluteString,
                 rc.allHTTPHeaderFields, rc.HTTPBody,
                 data, resp, err, cs, reqMs, reqTid);
    ch(data, resp, err);   // 原 block 照常执行
};
\`\`\`

一个关键细节：**记录请求时刻的毫秒时间戳与线程 id**（而非响应到达时刻）。慢请求下用响应时刻做锚点会把关联的加解密事件推出时间窗——\`correlate_request\` 工具按这个锚点聚合同一时间窗内的 crypto 事件。

## 第二层：resume 兜底（delegate 型任务）

delegate 型任务没有 completion block，只在 \`-[NSURLSessionTask resume]\` 时知道请求。swizzle \`resume\`，从 \`task.currentRequest\` 取请求体记录。

问题是第一层已经包过 completion 的任务会重复记录——用 \`objc_setAssociatedObject\` 打标记去重：被 completion 配对捕获的 task 在 \`resume\` 里跳过。

## 第三层：SSL_write / SSL_read（自带 TLS 栈）

App 若 bundle 了自己的 OpenSSL/BoringSSL（不走系统 TLS），代理连明文都看不到。此时 fishhook \`SSL_write\` / \`SSL_read\`：

\`\`\`c
static int hooked_SSL_write(void *ssl, const void *buf, int num) {
    if (num > 0 && buf && enabled) net_log(@"TLS", @"send", ...);
    return orig_SSL_write(ssl, buf, num);
}
\`\`\`

\`void *ssl\` 占位即可——只记录字节流不解析会话。系统 TLS 不经 App 的 import slot，多不命中属正常。

## 为什么不用代理

- 证书信任要用户手动装，pinning 直接失效方案；
- iOS 15+ 全局 HTTP 代理需要系统配置，注入场景改不动；
- 代理只见 TLS 流量，看不到 App 内部已完成解密的业务语义。

进程内抓包看到的永远是**明文业务层**，且与加解密、Keychain 事件天然共享调用栈与时间线。`,
    en: {
      title: 'Packet capture, in-process: three layers of plaintext',
      summary: 'No proxy, no certificates, no pinning fights—pair requests with responses inside NSURLSession completion callbacks, backstop delegate tasks via resume, and fishhook SSL_write/SSL_read for bundled TLS stacks.',
      content: `Proxy-based capture fights three mountains: iOS 15+ global proxy configuration, certificate trust, and **pinning**. In-process capture skips all three—it takes data straight from the app's own call chain.

## Layer 1: completion callback pairing (covers most apps)

The mainstream \`NSURLSession\` usage is completion-handlers. Swizzle the three task-creation methods:

\`\`\`c
-[NSURLSession dataTaskWithRequest:completionHandler:]
-[NSURLSession dataTaskWithURL:completionHandler:]
-[NSURLSession uploadTaskWithRequest:fromData:completionHandler:]
\`\`\`

The trick is the wrapping block: **the original \`request\` argument is still in scope**—request body, URL and headers are directly readable; when the response arrives, \`data\` / \`response\` / \`error\` give the body and status. Request and response pair naturally into one record:

\`\`\`c
DHDataCH wrapped = ^(NSData *data, NSURLResponse *resp, NSError *err) {
    net_log_pair(rc.HTTPMethod, rc.URL.absoluteString,
                 rc.allHTTPHeaderFields, rc.HTTPBody,
                 data, resp, err, cs, reqMs, reqTid);
    ch(data, resp, err);   // original block runs as usual
};
\`\`\`

One key detail: **record the request-time millisecond timestamp and thread id** (not response time). Anchoring by response time would push correlated crypto events out of the time window on slow requests—the \`correlate_request\` tool aggregates same-window crypto events by this anchor.

## Layer 2: resume backstop (delegate tasks)

Delegate-style tasks have no completion block; the request is only visible at \`-[NSURLSessionTask resume]\`. Swizzle \`resume\` and read \`task.currentRequest\`.

The catch: tasks already wrapped by layer 1 would be logged twice—dedupe with \`objc_setAssociatedObject\` marks; tasks captured by completion pairing are skipped in \`resume\`.

## Layer 3: SSL_write / SSL_read (bundled TLS stacks)

If the app bundles its own OpenSSL/BoringSSL (bypassing system TLS), a proxy cannot even see plaintext. fishhook \`SSL_write\` / \`SSL_read\` instead:

\`\`\`c
static int hooked_SSL_write(void *ssl, const void *buf, int num) {
    if (num > 0 && buf && enabled) net_log(@"TLS", @"send", ...);
    return orig_SSL_write(ssl, buf, num);
}
\`\`\`

A \`void *ssl\` placeholder suffices—log the byte stream without parsing sessions. System TLS does not flow through the app's import slots, so misses are expected.

## Why not a proxy

- Trusting certificates requires manual installation, and pinning defeats the scheme;
- iOS 15+ global HTTP proxy needs system configuration; injection cannot touch it;
- A proxy only sees TLS bytes, never the app-internal decrypted business semantics.

In-process capture always sees the **plaintext business layer**, sharing the same call stacks and timeline as crypto and Keychain events.`,
    },
  },
];

