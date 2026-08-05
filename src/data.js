// Shared content data for IOSDecryptHub site.

const ICON = {
  crypto: '<path d="M12 2 3 6v6c0 5 3.5 8.5 9 10 5.5-1.5 9-5 9-10V6l-9-4Z" stroke="currentColor" stroke-width="1.6"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  file: '<path d="M6 3h8l4 4v14H6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 3v4h4M9 13h6M9 16h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  system: '<rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M9 9h6v6H9zM9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  dump: '<path d="M12 3v11m0 0 4-4m-4 4-4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  mcp: '<circle cx="6" cy="12" r="2.4" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="6" r="2.4" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="18" r="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M8 11 16 7M8 13l8 4" stroke="currentColor" stroke-width="1.6"/>',
  health: '<path d="M3 12h4l2-6 4 12 2-6h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
};

export const DYLIB_DOWNLOAD = {
  version: '1.24.3',
  filename: 'decrypt_helper-1.24.3.dylib',
  url: '/dylibs/decrypt_helper-1.24.3.dylib',
  size: '2.2 MB',
  sha256: '010efd7d8440df45256db3533f545729625ddde5113de1fd1abe79370b47e5a8',
};

export const CAPABILITIES = [
  {
    icon: ICON.crypto, title: '加解密审计',
    desc: '拦截 CommonCrypto / SecKey / OpenSSL EVP：解析算法、Key、IV、明文、密文，一次性与流式都覆盖，每条附应用层调用栈。',
    tags: ['摘要', 'HMAC', '对称', '非对称', 'KDF'],
    en: { title: 'Crypto audit', desc: 'Intercepts CommonCrypto / SecKey / OpenSSL EVP: resolves algorithm, Key, IV, plaintext and ciphertext — one-shot and streaming — each with an app-level call stack.', tags: ['Digest', 'HMAC', 'Symmetric', 'Asymmetric', 'KDF'] },
  },
  {
    icon: ICON.file, title: '文件监控',
    desc: '钩住 open / write / unlink / rename，看清 App 在沙盒里读写、删除、重命名了哪些文件，并过滤系统噪音。',
    tags: ['open', 'write', 'unlink', 'rename'],
    en: { title: 'File monitoring', desc: 'Hooks open / write / unlink / rename to reveal which files the app reads, writes, deletes or renames inside its sandbox, with system noise filtered.', tags: ['open', 'write', 'unlink', 'rename'] },
  },
  {
    icon: ICON.system, title: '系统模块',
    desc: 'dlopen 载入的动态库、dlsym 动态符号解析全程可见；对已 hook 符号把 dlsym 结果重定向到 wrapper，堵住函数指针旁路。',
    tags: ['dlopen', 'dlsym', 'redirect'],
    en: { title: 'System modules', desc: 'dlopen-loaded libraries and dlsym symbol resolution are fully visible; dlsym results for hooked symbols are redirected to wrappers, closing the function-pointer bypass.', tags: ['dlopen', 'dlsym', 'redirect'] },
  },
  {
    icon: ICON.dump, title: '砸壳 / 脱壳',
    desc: '在进程内对内核已解密的 Mach-O 按需脱壳，产出裸 .decrypted 供静态分析，或重打包成可重签 IPA。零依赖 zip 写入。',
    tags: ['FairPlay', 'cryptid=0', '.decrypted', 'IPA'],
    en: { title: 'Decrypt / dump', desc: 'On-demand in-process dumping of the kernel-decrypted Mach-O into a bare .decrypted for static analysis, or repackaged as a re-signable IPA. Zero-dependency zip writer.', tags: ['FairPlay', 'cryptid=0', '.decrypted', 'IPA'] },
  },
  {
    icon: ICON.mcp, title: 'MCP 静态分析',
    desc: '进程内 MCP 服务器暴露 Capstone 反汇编、镜像枚举与 xref 四件套，AI 客户端可直接调用来读真实运行时代码。',
    tags: ['disassemble', 'xref', 'objc IMP'],
    en: { title: 'MCP static analysis', desc: 'An in-process MCP server exposes Capstone disassembly, image enumeration and the xref family, so AI clients can read real runtime code directly.', tags: ['disassemble', 'xref', 'objc IMP'] },
  },
  {
    icon: ICON.health, title: 'fail-loud 健康监控',
    desc: '每个 hook 安装后自检，没挂上的符号、起不来的服务、落盘失败都上报。悬浮窗 / 面板 / 控制台三处同时可见。',
    tags: ['self-check', '/api/stats', 'health'],
    en: { title: 'fail-loud health', desc: 'Every hook self-checks after install; unhooked symbols, dead services and disk failures are all reported. Visible in the floating window, panel and console at once.', tags: ['self-check', '/api/stats', 'health'] },
  },
];

// Live capture feed events (also reused conceptually by the mock panel)
export const CAPTURES = [
  {
    cat: 'symm', badge: 'AES', algo: 'AES-256-CBC · encrypt', meta: 'CCCrypt · PKCS7', size: '64 B',
    fields: [
      ['algo', 'AES-256-CBC / PKCS7', ''],
      ['key', 'a3f1c9…7e0b (32 B)', ''],
      ['iv', '00112233445566778899aabbccddeeff', ''],
      ['plain', '{"token":"sk_live_9f2a","uid":42}', 'plain'],
    ],
    hex: '000000: 7b 22 74 6f 6b 65 6e 22  3a 22 73 6b 5f 6c 69 76  |{"token":"sk_liv|\n000010: 65 5f 39 66 32 61 22 2c  22 75 69 64 22 3a 34 32  |e_9f2a","uid":42|',
    stack: ['0  <b>Crypto</b> `-[SessionCipher encrypt:]` +0x88', '1  <b>Crypto</b> `-[APIClient sign:]` +0x1c4', '2  UIKitCore `-[UIButton _sendAction]` +0x9c'],
  },
  {
    cat: 'hmac', badge: 'HMAC', algo: 'HMAC-SHA256', meta: 'CCHmac', size: '32 B',
    fields: [
      ['algo', 'HMAC-SHA256', ''],
      ['key', 'server_secret_v3 (16 B)', ''],
      ['plain', 'GET/v2/orders?ts=1753238400', 'plain'],
      ['mac', '9c1f…a4 (32 B)', ''],
    ],
    hex: '000000: 47 45 54 2f 76 32 2f 6f  72 64 65 72 73 3f 74 73  |GET/v2/orders?ts|\n000010: 3d 31 37 35 33 32 33 38  34 30 30                 |=1753238400|',
    stack: ['0  <b>Crypto</b> `-[Signer hmacForRequest:]` +0x40', '1  <b>Crypto</b> `-[APIClient send:]` +0x210'],
  },
  {
    cat: 'digest', badge: 'SHA256', algo: 'SHA-256 · streaming', meta: 'CC_SHA256_Update ×3', size: '1.4 KB',
    fields: [
      ['algo', 'SHA-256 (Init/Update/Final)', ''],
      ['plain', '…3 个分片已拼回完整明文…', 'plain'],
      ['digest', 'e3b0c442…b855 (32 B)', ''],
    ],
    hex: '000000: 89 50 4e 47 0d 0a 1a 0a  00 00 00 0d 49 48 44 52  |.PNG........IHDR|\n000010: 00 00 02 00 00 00 02 00  08 06 00 00 00 f4 78 d4  |..............x.|',
    stack: ['0  <b>Crypto</b> `-[Uploader digestChunk:]` +0x64', '1  <b>Crypto</b> `-[Uploader flush]` +0xf0'],
  },
  {
    cat: 'evp', badge: 'EVP', algo: 'ChaCha20-Poly1305', meta: 'EVP_EncryptUpdate · libcrypto', size: '128 B',
    fields: [
      ['algo', 'ChaCha20-Poly1305 (AEAD)', ''],
      ['key', 'ephemeral_x25519 (32 B)', ''],
      ['iv', 'random 12 B nonce', ''],
      ['aad', 'v=1;alg=c20p', ''],
      ['plain', 'msg:hello from device', 'plain'],
    ],
    hex: '000000: 6d 73 67 3a 68 65 6c 6c  6f 20 66 72 6f 6d 20 64  |msg:hello from d|\n000010: 65 76 69 63 65                                    |evice|',
    stack: ['0  libcrypto EVP_EncryptUpdate +0x0', '1  <b>MyApp</b> `-[E2EChannel seal:]` +0xa8'],
  },
  {
    cat: 'asym', badge: 'RSA', algo: 'RSA-2048 · sign', meta: 'SecKeyCreateSignature', size: '256 B',
    fields: [
      ['algo', 'RSA-2048 PKCS1v15-SHA256', ''],
      ['key', 'SecKeyRef 0x2803… (private)', ''],
      ['plain', 'nonce=8f3a;device=iPhone16', 'plain'],
      ['sig', '5b7d…1e (256 B)', ''],
    ],
    hex: '000000: 6e 6f 6e 63 65 3d 38 66  33 61 3b 64 65 76 69 63  |nonce=8f3a;devic|\n000010: 65 3d 69 50 68 6f 6e 65  31 36                    |e=iPhone16|',
    stack: ['0  Security SecKeyCreateSignature +0x0', '1  <b>MyApp</b> `-[Attestation prove]` +0x134'],
  },
  {
    cat: 'kdf', badge: 'PBKDF2', algo: 'PBKDF2-HMAC-SHA256', meta: 'CCKeyDerivationPBKDF · 100000 it', size: '32 B',
    fields: [
      ['algo', 'PBKDF2 / PRF=HMAC-SHA256', ''],
      ['pass', 'hunter2 (明文口令)', 'plain'],
      ['salt', 'f0e1d2c3b4a5 (8 B)', ''],
      ['iter', '100000', ''],
      ['dk', '2f9c…be (32 B)', ''],
    ],
    hex: '000000: 68 75 6e 74 65 72 32                              |hunter2|',
    stack: ['0  <b>Crypto</b> `-[Vault deriveKey:]` +0x50', '1  <b>Crypto</b> `-[Vault unlock:]` +0x8c'],
  },
];

export const ALGO_GROUPS = [
  { title: '摘要 Digest', note: '一次性 + 流式 Init/Update/Final', items: ['MD2', 'MD4', 'MD5', 'SHA1', 'SHA224', 'SHA256', 'SHA384', 'SHA512'], enTitle: 'Digest', enNote: 'One-shot + streaming Init/Update/Final' },
  { title: 'HMAC', note: 'CCHmac 系列', items: ['HMAC-MD5', 'HMAC-SHA1', 'HMAC-SHA256', 'HMAC-SHA384', 'HMAC-SHA512'], enTitle: 'HMAC', enNote: 'CCHmac family' },
  { title: '对称 Symmetric', note: 'CCCrypt / CCCryptor · 自动识别模式与填充', items: ['AES', 'DES', '3DES', 'RC4', 'RC2', 'CAST', 'Blowfish', 'ECB', 'CBC', 'CTR', 'CFB', 'OFB', 'PKCS7'], enTitle: 'Symmetric', enNote: 'CCCrypt / CCCryptor · mode & padding auto-detected' },
  { title: 'OpenSSL EVP', note: '目标链接 libcrypto 时', items: ['AES-GCM', 'AES-CBC', 'ChaCha20-Poly1305', 'SM4', 'Camellia', 'DES/3DES', 'CCM', 'AAD/tag'], enTitle: 'OpenSSL EVP', enNote: 'When the target links libcrypto' },
  { title: '非对称 Asymmetric', note: 'SecKey 系列', items: ['RSA sign', 'RSA verify', 'RSA encrypt', 'RSA decrypt', 'EC sign', 'EC verify'], enTitle: 'Asymmetric', enNote: 'SecKey family' },
  { title: '密钥派生 KDF', note: '记录口令 / salt / 迭代', items: ['PBKDF2', 'PRF-SHA256', 'salt', 'iterations'], enTitle: 'KDF', enNote: 'Captures passphrase / salt / iterations' },
];

const P_ICON = {
  mem: '<rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M7 6v12M12 6v12M17 6v12" stroke="currentColor" stroke-width="1.4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" stroke-width="1.6"/>',
  flag: '<path d="M6 21V4m0 0 h11l-2 4 2 4H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  box: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="m3 7 9 5 9-5M12 12v10" stroke="currentColor" stroke-width="1.5"/>',
};

export const DUMP_STEPS = [
  { n: '01', icon: P_ICON.mem, title: '内核已解密', desc: 'FairPlay 的 __TEXT 在运行时被内核解密进内存，注入的 dylib 就在同一进程里。' },
  { n: '02', icon: P_ICON.copy, title: '回写磁盘', desc: '把已解密的页复制出一份磁盘镜像副本，覆盖原加密段。' },
  { n: '03', icon: P_ICON.flag, title: 'cryptid = 0', desc: '将 LC_ENCRYPTION_INFO_64 的 cryptid 置 0，标记为「已脱壳」。' },
  { n: '04', icon: P_ICON.box, title: '产出产物', desc: '裸 .decrypted 供 IDA / Ghidra / class-dump；或塞回 .app 打包成可重签 IPA。' },
];

export const DUMP_NOTES = [
  { good: true, label: '覆盖范围', text: '主程序 + App 自带、已加载、cryptid=1 的 Frameworks / .dylib。' },
  { good: false, label: '边界 · 扩展进程', text: 'PlugIns/*.appex（Share/Widget）是独立进程，主进程未加载，砸不到。' },
  { good: false, label: '合规', text: '仅限授权安全测试与自有 App，分发受版权保护的程序可能违法。' },
];

const compactTool = (name, tier, req, desc, args, result, descEn) => ({
  name, tier, req, desc, desc_en: descEn,
  in: JSON.stringify({ name, arguments: args }, null, 2),
  out: JSON.stringify(result, null, 2),
});

export const MCP_TOOLS = [
  {
    name: 'disassemble', tier: 'tier-0', req: 'bytes',
    desc: '反汇编一段 hex 字节，容忍空格与 0x 前缀。arch 默认 arm64，也支持 arm / thumb。',
    desc_en: 'Disassembles a hex byte string, tolerating spaces and 0x prefixes. arch defaults to arm64, arm / thumb also supported.',
    in: '{\n  "name": "disassemble",\n  "arguments": {\n    "bytes": "fd7bbfa9 fd030091 c0035fd6",\n    "arch": "arm64"\n  }\n}',
    out: '{ "count": 3, "instructions": [\n  { "address":"0x0","mnemonic":"stp","op_str":"x29, x30, [sp, #-0x10]!" },\n  { "address":"0x4","mnemonic":"mov","op_str":"x29, sp" },\n  { "address":"0x8","mnemonic":"ret","op_str":"" }\n] }',
  },
  {
    name: 'analyze_function', tier: 'tier-0', req: 'address, size',
    desc: '安全读取进程内存 address..+size 并反汇编，vm_read_overwrite 防护，不可读地址返回 isError 而非崩溃。',
    desc_en: 'Safely reads process memory address..+size and disassembles it with vm_read_overwrite protection; unreadable addresses return isError instead of crashing.',
    in: '{\n  "name": "analyze_function",\n  "arguments": {\n    "address": "0x1029ac000",\n    "size": 64\n  }\n}',
    out: '{ "count": 16, "base": "0x1029ac000",\n  "instructions": [\n    { "address":"0x1029ac000","mnemonic":"sub","op_str":"sp, sp, #0x40" },\n    { "address":"0x1029ac004","mnemonic":"stp","op_str":"x29, x30, [sp, #0x30]" }\n  ] }',
  },
  {
    name: 'get_macho_info', tier: 'tier-0', req: '—',
    desc: '列举 App bundle 内已加载镜像：load_address、cryptid、加密状态。砸壳与 analyze_function 的地址起点。',
    desc_en: 'Lists loaded images in the app bundle: load_address, cryptid, encryption status. Address source for dumps and analyze_function.',
    in: '{ "name": "get_macho_info", "arguments": {} }',
    out: '{ "images": [\n  { "name":"MyApp","load_address":"0x1029a8000","cryptid":1,"encrypted":true },\n  { "name":"Frameworks/Core.dylib","load_address":"0x10a1c0000","cryptid":1 }\n] }',
  },
  {
    name: 'list_imports', tier: 'tier-0', req: 'image_index',
    desc: '列举某镜像的导入（undefined）符号——fishhook 可 rebind 的候选。支持 query 子串过滤。',
    desc_en: 'Lists imported (undefined) symbols of an image — candidates fishhook can rebind. Supports substring filtering via query.',
    in: '{\n  "name": "list_imports",\n  "arguments": { "image_index": 0, "query": "CC" }\n}',
    out: '{ "count": 4, "symbols": [\n  "CCCrypt","CCHmac","CC_SHA256_Init","CCKeyDerivationPBKDF"\n] }',
  },
  {
    name: 'find_xrefs', tier: 'tier-1', req: 'symbol 或 address',
    desc: '「谁调用了它」：扫 __text 里所有直接 bl 到目标的调用点，经运行时 GOT + dladdr 把 import stub 还原成真实符号。',
    desc_en: 'Who calls it: scans all direct bl call sites in __text and resolves import stubs to real symbols via runtime GOT + dladdr.',
    in: '{\n  "name": "find_xrefs",\n  "arguments": { "symbol": "CCCrypt" }\n}',
    out: '{ "count": 2, "xrefs": [\n  { "call_site":"0x1029b120","from_func":"-[SessionCipher encrypt:]+0x88","kind":"call_import_stub","resolved_name":"hook_CCCrypt" }\n] }',
  },
  {
    name: 'find_string_refs', tier: 'tier-2A', req: 'string 或 address',
    desc: '「谁引用了这个字符串」：恢复 ADRP+ADD（直接）/ ADRP+LDR（间接指针槽）的数据地址，落在字符串 section 则记引用点。',
    desc_en: 'Who references this string: recovers ADRP+ADD (direct) / ADRP+LDR (indirect slot) data addresses and records refs landing in string sections.',
    in: '{\n  "name": "find_string_refs",\n  "arguments": { "string": "password" }\n}',
    out: '{ "count": 1, "refs": [\n  { "ref_site":"0x1029c044","string":"password","section":"__cstring","indirect":false,"from_func":"-[LoginVM submit]+0x2c" }\n] }',
  },
  {
    name: 'find_selector_refs', tier: 'tier-2B', req: 'selector',
    desc: '「谁把这个 selector 用在了 objc 调用上」：xref 站点是 objc_msgSend 的 call_site，不报裸 selref 加载。',
    desc_en: 'Who uses this selector in objc calls: xref sites are objc_msgSend call_sites, bare selref loads are not reported.',
    in: '{\n  "name": "find_selector_refs",\n  "arguments": { "selector": "setRawT:" }\n}',
    out: '{ "count": 1, "refs": [\n  { "call_site":"0x1029d180","selector":"setRawT:","target_kind":"objc_stub","from_func":"-[WBValidator run]+0x40" }\n] }',
  },
  {
    name: 'find_function_refs', tier: 'tier-3A', req: 'target',
    desc: '内部调用图：本镜像 __text 内 BL 的 from_func → to_func 边，direction 取 callers / callees / both。',
    desc_en: 'Internal call graph: BL edges from_func to_func inside this image\u2019s __text; direction is callers / callees / both.',
    in: '{\n  "name": "find_function_refs",\n  "arguments": { "target": "0x1029ac000", "direction": "callers" }\n}',
    out: '{ "count": 3, "edges": [\n  { "relation":"caller","from_func":"-[APIClient sign:]","to_func_start":"0x1029ac000","call_site":"0x1029b0f4" }\n] }',
  },
  {
    name: 'list_functions', tier: 'tier-3B', req: '—',
    desc: '函数清单（LC_FUNCTION_STARTS）：name（符号或 sub_addr）、start、vmaddr、size。strip 后仍可列出。',
    desc_en: 'Function listing (LC_FUNCTION_STARTS): name (symbol or sub_addr), start, vmaddr, size. Works even after stripping.',
    in: '{\n  "name": "list_functions",\n  "arguments": { "query": "cipher", "limit": 3 }\n}',
    out: '{ "count": 3, "functions": [\n  { "name":"-[SessionCipher encrypt:]","start":"0x1029ac000","vmaddr":"0x4000","size":184 }\n] }',
  },
  {
    name: 'objc_resolve_imp', tier: 'tier-4', req: 'selector + class/object',
    desc: 'selector → 运行时真实 IMP：破 objc 动态派发。给类名或活对象地址 + selector，返回 IMP、声明类、image、dladdr 符号。',
    desc_en: 'selector to real runtime IMP: breaks objc dynamic dispatch. Give a class name or live object + selector to get IMP, declaring class, image and dladdr symbol.',
    in: '{\n  "name": "objc_resolve_imp",\n  "arguments": {\n    "class": "WBValidatorModel",\n    "selector": "setRawT:"\n  }\n}',
    out: '{ "found": true,\n  "imp": "0x10a1c4d20",\n  "resolving_class": "WBValidatorModel",\n  "image": "Frameworks/Core.dylib",\n  "symbol": "-[WBValidatorModel setRawT:]" }',
  },
  compactTool('disassemble_function', 'analysis', 'address', '从运行时地址开始反汇编，遇到 ret 或达到 max_bytes 时停止，适合读取完整函数。',
    { address: '0x1029ac000', max_bytes: 4096 }, { count: 42, stop_reason: 'ret', base: '0x1029ac000' }, 'Disassembles from a runtime address, stopping at ret or max_bytes; for reading whole functions.'),
  compactTool('resolve_symbol', 'analysis', 'name', '通过 dlsym 把导出符号名解析为运行时地址，可直接交给 disassemble_function。',
    { name: 'CCCrypt' }, { found: true, address: '0x1a42b8130', image: 'libcommonCrypto.dylib' }, 'Resolves an exported symbol name to a runtime address via dlsym; feed the result to disassemble_function.'),
  compactTool('symbolicate', 'analysis', 'address', '通过 dladdr 把运行时地址解析为最近符号、镜像与偏移。',
    { address: '0x1029ac1f8' }, { found: true, symbol: '-[SessionCipher encrypt:]', offset: 504, image: 'CryptoTestHost' }, 'Resolves a runtime address to the nearest symbol, image and offset via dladdr.'),
  compactTool('read_memory', 'memory', 'address', '安全读取进程数据内存，返回 Hex、ASCII 和 HexDump，适合检查 Key、常量与结构体。',
    { address: '0x1029bc000', size: 64 }, { address: '0x1029bc000', size: 64, hex: '7365637265742d6b6579…', ascii: 'secret-key' }, 'Safely reads process data memory, returning Hex, ASCII and HexDump; for inspecting keys, constants and structs.'),
  compactTool('search_memory', 'memory', 'address, length', '在指定内存范围内搜索 UTF-8 字符串或十六进制字节模式，自动跳过不可读页。',
    { address: '0x1029a8000', length: 16777216, string: 'user-password' }, { count: 1, hits: ['0x102a7c118'] }, 'Searches a memory range for UTF-8 strings or hex byte patterns, skipping unreadable pages automatically.'),
  compactTool('list_images', 'analysis', '—', '列出全部已加载镜像及其独立 image_index；调用 list_imports 前应先使用本工具。',
    {}, { count: 84, images: [{ index: 0, name: 'CryptoTestHost', load_address: '0x1029a8000' }] }, 'Lists all loaded images with their stable image_index; call this before list_imports.'),
  compactTool('get_stats', 'forensic', '—', '取证总览：各分类事件数、捕获开关、宿主进程、Hook 健康、落盘大小与噪声统计。',
    {}, { total: 141, counts: { crypto: 67, sys: 25, net: 2, keychain: 4 }, health: { installed: 124, failed: 0 } }, 'Forensic overview: per-category event counts, capture toggles, host process, hook health, disk usage and noise stats.'),
  compactTool('query_events', 'forensic', '—', '检索加解密、文件、系统、网络与 Keychain 事件；返回最新优先的摘要，可按大小、时间、线程和输出过滤。',
    { category: 'sym', query: 'AES', min_size: 16, limit: 20 }, { count: 2, events: [{ seq: 118, algorithm: 'AES-128-CBC', operation: 'encrypt', inLen: 53 }] }, 'Queries crypto, file, system, network and Keychain events; newest first, filterable by size, time, thread and output.'),
  compactTool('correlate_request', 'forensic', 'net_seq', '以网络请求为锚点，聚合时间窗口内的加解密与 Keychain 事件，并反查 Base64 请求头对应的输出。',
    { net_seq: 141, window_ms: 300, match_header: 'X-Validator' }, { anchor: 141, match: { header: 'X-Validator', event_seq: 139, algorithm: 'SHA256' } }, 'Anchors on a network request to aggregate crypto and Keychain events in a time window, and reverse-looks-up Base64 header outputs.'),
  compactTool('get_event', 'forensic', 'seq', '按 seq 获取完整事件：算法、Key、IV、明文、密文、HexDump 与结构化调用栈。',
    { seq: 118 }, { seq: 118, algorithm: 'AES-128-CBC', inputUtf8: 'the answer is 42…', keyHex: '00112233…', callStackFrames: 2 }, 'Fetches a full event by seq: algorithm, Key, IV, plaintext, ciphertext, HexDump and structured call stack.'),
  compactTool('query_noise', 'forensic', '—', '查询被噪声规则从主事件流分流的高频事件。',
    { board: 'crypto', query: 'MGCopyAnswer', limit: 100 }, { count: 1, events: [{ seq: 110, algorithm: 'MD5', preview: 'MGCopyAnswerapple-internal-install' }] }, 'Queries high-frequency events diverted from the main stream by noise rules.'),
  compactTool('list_files', 'sandbox', '—', '列出宿主 App 沙盒 Documents、Library、tmp 下的文件与目录。',
    { path: 'Documents' }, { path: 'Documents', entries: [{ name: 'iosdh_test.txt', type: 'file', size: 59 }] }, 'Lists files and directories under the host app sandbox: Documents, Library, tmp.'),
  compactTool('read_file', 'sandbox', 'path', '预览沙盒文件，文本返回 UTF-8，否则返回 HexDump。',
    { path: 'Documents/iosdh_test.txt', limit: 4096 }, { path: 'Documents/iosdh_test.txt', size: 59, utf8: 'IOSDecryptHub file hook test - 文件操作测试数据' }, 'Previews a sandbox file; UTF-8 for text, HexDump otherwise.'),
  compactTool('dump_status', 'dump', '—', '列出当前进程内可脱壳的 App Bundle Mach-O，并返回异步砸壳任务状态。',
    {}, { state: 'idle', images: [{ name: 'CryptoTestHost', encrypted: true, cryptid: 1, size: 25480396 }] }, 'Lists dumpable App Bundle Mach-Os in the process and returns async dump task state.'),
  compactTool('set_capture', 'control', 'name, enabled', '按 Hook 函数粒度启用或停用捕获；可用名称来自 get_stats.capture。',
    { name: 'CCCrypt', enabled: false }, { ok: true, name: 'CCCrypt', enabled: false }, 'Enables or disables capture per hooked function; names come from get_stats.capture.'),
  compactTool('set_pause', 'control', 'paused', '全局或按分类暂停/继续事件记录。',
    { category: 'sym', paused: true }, { ok: true, category: 'sym', paused: true }, 'Pauses or resumes event recording globally or per category.'),
  compactTool('clear_events', 'control', '—', '清空内存中的事件；落盘日志不受影响，仍可下载。',
    { category: 'crypto' }, { ok: true, category: 'crypto', cleared: 67 }, 'Clears in-memory events; on-disk logs are unaffected and still downloadable.'),
  compactTool('start_dump', 'control', '—', '触发设备端异步脱壳，可选裸解密二进制或可重签 IPA；进度用 dump_status 查询。',
    { mode: 'ipa' }, { accepted: true, task_id: 'dump-7', state: 'running' }, 'Triggers an async on-device dump, optionally a bare decrypted binary or a re-signable IPA; poll dump_status for progress.'),
  compactTool('get_spoof', 'config', '—', '读取越狱隐藏、反调试与设备参数伪装配置。',
    {}, { jailbreak: { enabled: true, paths: ['/var/jb'] }, anti_debug: { enabled: true }, device: { enabled: false } }, 'Reads jailbreak hiding, anti-debug and device-spoofing config.'),
  compactTool('set_spoof', 'config', 'group, op', '修改反检测配置：越狱路径/URL Scheme/注入镜像隐藏、反调试或设备参数伪装。',
    { group: 'anti', op: 'enable', on: true }, { ok: true, anti_debug: { enabled: true } }, 'Updates anti-detection config: hiding jailbreak paths/URL schemes/injected images, anti-debug or device spoofing.'),
  compactTool('get_noise_config', 'config', '—', '读取 crypto 或 sys 噪声板的开关与特征串列表。',
    { board: 'crypto' }, { board: 'crypto', enabled: true, patterns: ['MGCopyAnswer'] }, 'Reads the toggle and pattern list of the crypto or sys noise board.'),
  compactTool('set_noise_config', 'config', 'op', '启停噪声板，或添加/移除精确匹配的噪声特征串。',
    { board: 'crypto', op: 'add', text: 'CFNetworkCopySystemProxySettings' }, { ok: true, enabled: true, patterns: ['MGCopyAnswer', 'CFNetworkCopySystemProxySettings'] }, 'Toggles a noise board, or adds/removes exact-match noise patterns.'),
  compactTool('clear_noise', 'control', '—', '清空指定噪声板的内存事件；落盘记录不变。',
    { board: 'crypto' }, { ok: true, board: 'crypto', cleared: 1 }, 'Clears in-memory events of a noise board; on-disk records unchanged.'),
  compactTool('get_config', 'config', '—', '读取内存事件保留数与落盘日志文件上限。',
    {}, { maxEntries: 5000, maxFileBytes: 52428800, logBytes: 184320 }, 'Reads in-memory event retention and on-disk log file limits.'),
  compactTool('set_config', 'config', '—', '修改内存保留与落盘滚动配置，并返回更新后的快照。',
    { maxEntries: 10000, maxFileBytes: 104857600 }, { ok: true, maxEntries: 10000, maxFileBytes: 104857600 }, 'Updates memory retention and on-disk rotation config and returns the new snapshot.'),
  compactTool('get_diag', 'diagnostic', '—', '获取 Hook 健康、持久化和服务事件的审查时间线，以及未成功 Hook 的符号清单。',
    { board: 'crypto' }, { board: 'crypto', diag: '[14:32:17] digest hooks 24/24\n[14:32:17] symmetric hooks 6/6', unhooked: '' }, 'Gets an audit timeline of hook health, persistence and service events, plus the list of unhooked symbols.'),
];

// 2026-08-01: CryptoTestHost 经注入后从 8088 接口导出的测试快照。
// 沙盒绝对路径已归一化，避免把本机容器 UUID 带进官网。
const TEST_MESSAGE = 'decrypt-helper interactive test sample';
const TEST_STACK = '0  CryptoTestHost  do_digest + 0xa8\n1  CryptoTestHost  -[TestVC onAll] + 0x38\n2  CryptoTestHost  -[TestVC triggerByKey:] + 0x110';
const CRYPTO_OUTPUTS = {
  md5: 'e6ac8d5f32d40c9d693ea7dc038a604e',
  sha1: '1b74a3e0e615890ccbec4a3d2ebff783bcc2c9b0',
  sha256: 'c2bef6e7bc6568e6f14fd5280bb58a07f239795153ad682f524f9c006299fe41',
  sha512: 'c95a62c123444695de1e80959bd29e4eca0dbdb3d773b7bc1cccf7033c0ae06770973df44dbcadba007e009f621a3633c3f7328e394ff3c39920fa4f0fbc42ac',
  hmac: 'f70b81bedc6961d87de7bb02330da9c72f24a6571dff2eec076526e6199219db',
};

const cryptoRow = (seq, cat, badge, algo, op, time, inLen, outLen, output, extra = {}) => ({
  seq, cat, badge, algo, op, time, inLen, outLen,
  preview: extra.preview || TEST_MESSAGE,
  input: extra.input || TEST_MESSAGE,
  output,
  key: extra.key || '',
  iv: extra.iv || '',
  stack: extra.stack || TEST_STACK,
});

export const PANEL_TABS = [
  {
    key: 'crypto', label: '加解密',
    rows: [
      cryptoRow(35, 'digest', '摘要', 'SHA256 (streaming)', 'digest', '2026-08-01 15:31:58.185', 73, 32, 'ba50280d1a55cc9fc1ab4512a14a7f4c94d1ca20338da2d291131067cad4eac2', { preview: 'b75ab8db61392af6b38fd78182df2aa6105dfa4fd1d2bcfcdf25c6f8c47ddfcc', input: 'b75ab8db61392af6b38fd78182df2aa6105dfa4fd1d2bcfcdf25c6f8c47ddfccf2ed008acfb8b5a85580b43468bae0f2f541ee5e382ddbffaf12f28d732ede223132372e302e302e31' }),
      cryptoRow(32, 'digest', '摘要', 'SHA256 (streaming)', 'digest', '2026-08-01 15:31:58.179', 73, 32, 'ba50280d1a55cc9fc1ab4512a14a7f4c94d1ca20338da2d291131067cad4eac2', { preview: 'b75ab8db61392af6b38fd78182df2aa6105dfa4fd1d2bcfcdf25c6f8c47ddfcc', input: 'b75ab8db61392af6b38fd78182df2aa6105dfa4fd1d2bcfcdf25c6f8c47ddfccf2ed008acfb8b5a85580b43468bae0f2f541ee5e382ddbffaf12f28d732ede223132372e302e302e31' }),
      cryptoRow(31, 'digest', '摘要', 'SHA256 (streaming)', 'digest', '2026-08-01 15:31:58.178', 73, 32, 'ba50280d1a55cc9fc1ab4512a14a7f4c94d1ca20338da2d291131067cad4eac2', { preview: 'b75ab8db61392af6b38fd78182df2aa6105dfa4fd1d2bcfcdf25c6f8c47ddfcc', input: 'b75ab8db61392af6b38fd78182df2aa6105dfa4fd1d2bcfcdf25c6f8c47ddfccf2ed008acfb8b5a85580b43468bae0f2f541ee5e382ddbffaf12f28d732ede223132372e302e302e31' }),
      cryptoRow(29, 'digest', '摘要', 'SHA256', 'digest', '2026-08-01 15:31:58.167', 45, 32, '7858c5559b87afc2...', { preview: '{"probe":"network-capture","secret":"s3cr3t"}', input: '{"probe":"network-capture","secret":"s3cr3t"}' }),
      cryptoRow(28, 'symm', '对称', 'AES-128-CBC-PKCS7', 'encrypt', '2026-08-01 15:31:58.079', 38, 48, '9954f29e1585643e671b529426328fee8c585a8627bef8e8fb88df1569fe8990ac17f68f244e5e3280bd4a56ec48df0f', { key: '000102030405060708090a0b0c0d0e0f', iv: '101112131415161718191a1b1c1d1e1f' }),
      cryptoRow(26, 'digest', '摘要', 'MD5', 'digest', '2026-08-01 15:31:58.071', 38, 16, CRYPTO_OUTPUTS.md5),
      cryptoRow(12, 'asym', '非对称', 'ENC-algid:encrypt:RSA:OAEP:SHA256', 'encrypt', '2026-08-01 15:31:55.470', 38, 256, '9cb68aaa86eb3d6573cbbe2f8ad35e7390460006215f045602ed2b22bafabeb39324a9c431f9cc87f189fd4187efdc8b0f3733274d0c1e3c39d1688b2f492a8f179ae2f8128f05e515bf138964c6815fc18bf89426742cb646b355d3e6d4ac2297c74ab4de3048d07aeaec0720fbe2d9d966067687196059f1539acbfff7e910b83fd4d1e5c93fefe7ed8a70276bc47250b0f67de7e5990f1ff07c770cfa45386d106e9879e7466fa4e3da70d982dc7599e1982f169c90a1a252f0d2ffed443e7d72497126be8b737a0383be9a40672f15cd443e0b025abba39f59985ef2db9d853ce2f570d10d4331c275f81157a4ee402d8e9a3bf0669cc3a3688c0d3669c4'),
      cryptoRow(11, 'asym', '非对称', 'SIGN-algid:sign:RSA:message-PKCS1v15:SHA256', 'sign', '2026-08-01 15:31:55.469', 38, 256, '63a2390717c2699dcc8bb462deefe272f031c472fb89d792910ba0ed93a57ab2db37c9e8f600573dc52883ef297a8cda994ffd9e5dac6e29cb43c2c383160e63a5a8f4b3992611684c4ee065496a7fe853628c621f1423a06d857e00a113ec3158818475b5c61efb62a8fb82c7d35c9918d6c59f421a0abb7573e71c71610beacf9fd3f5282886121dcb0020d881f73257cae65b1d2e9f83c8f4a3a9f48d13245a195a086bd6cb0d248a2c35c4815e79669e703f9f0726c07d9b049cfd59c14fa7619b65cf0ff303df66d3d9781ab7289ff46ce8c5109cfee82995803847b47bceb9c97c91ceb9b870204666c79d1cab1120a26d5a4a994a59e5fca47221f920'),
      cryptoRow(9, 'symm', '对称', 'RC4-CBC-NoPad', 'encrypt', '2026-08-01 15:31:55.406', 38, 38, '8df9238b3e926de16ebefbb66baf0a26bd05e42d93d43687f9fb85ad9c449722285b266f5c66', { key: '000102030405060708090a0b0c0d0e0f' }),
      cryptoRow(8, 'symm', '对称', 'DES-CBC-PKCS7', 'encrypt', '2026-08-01 15:31:55.401', 38, 40, '8f71b2e5a3f77b8504f1c2603b45bba182f24801392a2a72ceb7f51a9c3aefd8855ae219da037d47', { key: '0001020304050607', iv: '1011121314151617' }),
      cryptoRow(7, 'symm', '对称', '3DES-CBC-PKCS7', 'encrypt', '2026-08-01 15:31:55.397', 38, 40, 'cd657a7d58d639543c646302c44bcd1d0220f70f5741622b5fd28e7249580ac2f23825fa7dde155f', { key: '000102030405060708090a0b0c0d0e0f1011121314151617', iv: '1011121314151617' }),
      cryptoRow(6, 'symm', '对称', 'AES-128-CBC-PKCS7', 'encrypt', '2026-08-01 15:31:55.393', 38, 48, 'b9ac6f5d89bd9b5170e473aa26bfe6b04fc0367ce7bdb9adf85cfc2cd9dd4c4aabad6107cb548701e88385476bc48837', { key: '000102030405060708090a0b0c0d0e0f', iv: '101112131415161718191a1b1c1d1e1f', stack: '0  CryptoTestHost  do_sym + 0x164\n1  CryptoTestHost  -[TestVC onAll] + 0x54\n2  CryptoTestHost  -[TestVC triggerByKey:] + 0x110' }),
      cryptoRow(5, 'hmac', 'HMAC', 'HMAC-SHA256', 'digest', '2026-08-01 15:31:55.389', 38, 32, CRYPTO_OUTPUTS.hmac, { key: '7365637265742d6b6579', stack: '0  CryptoTestHost  do_hmac + 0x74\n1  CryptoTestHost  -[TestVC onAll] + 0x44\n2  CryptoTestHost  -[TestVC triggerByKey:] + 0x110' }),
      cryptoRow(4, 'digest', '摘要', 'SHA512', 'digest', '2026-08-01 15:31:55.386', 38, 64, CRYPTO_OUTPUTS.sha512),
      cryptoRow(3, 'digest', '摘要', 'SHA256', 'digest', '2026-08-01 15:31:55.382', 38, 32, CRYPTO_OUTPUTS.sha256),
      cryptoRow(2, 'digest', '摘要', 'SHA1', 'digest', '2026-08-01 15:31:55.378', 38, 20, CRYPTO_OUTPUTS.sha1),
      cryptoRow(1, 'digest', '摘要', 'MD5', 'digest', '2026-08-01 15:31:55.374', 38, 16, CRYPTO_OUTPUTS.md5),
    ],
  },
  {
    key: 'sys', label: '系统',
    rows: [
      { seq: 37, cat: 'sys', badge: '系统', algo: 'sysctl', op: 'mib=4.17', time: '2026-08-01 15:31:58.188', inLen: 0, outLen: 0, preview: '', input: '', output: '', stack: '0  CryptoTestHost  triggerScenarioById: + 0x238' },
      { seq: 36, cat: 'sys', badge: '系统', algo: 'sysctl', op: 'mib=4.17', time: '2026-08-01 15:31:58.187', inLen: 0, outLen: 0, preview: '', input: '', output: '', stack: '0  CryptoTestHost  triggerScenarioById: + 0x238' },
      { seq: 34, cat: 'sys', badge: '系统', algo: 'sysctl', op: 'mib=4.17', time: '2026-08-01 15:31:58.183', inLen: 0, outLen: 0, preview: '', input: '', output: '', stack: '0  CryptoTestHost  triggerScenarioById: + 0x238' },
      { seq: 33, cat: 'sys', badge: '系统', algo: 'sysctl', op: 'mib=4.17', time: '2026-08-01 15:31:58.181', inLen: 0, outLen: 0, preview: '', input: '', output: '', stack: '0  CryptoTestHost  triggerScenarioById: + 0x238' },
      { seq: 30, cat: 'sys', badge: '系统', algo: 'dlsym', op: 'resolved', time: '2026-08-01 15:31:58.170', inLen: 0, outLen: 0, preview: 'RTLD_DEFAULT | dh_http_url', input: 'RTLD_DEFAULT | dh_http_url', output: 'resolved', stack: '0  CryptoTestHost  do_network + 0x2dc' },
      { seq: 27, cat: 'sys', badge: '系统', algo: 'dlsym', op: 'redirect', time: '2026-08-01 15:31:58.075', inLen: 0, outLen: 0, preview: 'RTLD_DEFAULT | CCCrypt -> hook', input: 'RTLD_DEFAULT | CCCrypt', output: 'hooked_CCCrypt', stack: '0  CryptoTestHost  do_dlsym + 0x88' },
      { seq: 25, cat: 'sys', badge: '系统', algo: 'dlsym', op: 'redirect', time: '2026-08-01 15:31:58.067', inLen: 0, outLen: 0, preview: 'RTLD_DEFAULT | CC_MD5 -> hook', input: 'RTLD_DEFAULT | CC_MD5', output: 'hooked_CC_MD5', stack: '0  CryptoTestHost  do_dlsym + 0x30' },
      { seq: 24, cat: 'sys', badge: '系统', algo: 'dlopen', op: 'loaded', time: '2026-08-01 15:31:57.959', inLen: 0, outLen: 0, preview: '/usr/lib/libz.dylib', input: '/usr/lib/libz.dylib', output: '', stack: '0  CryptoTestHost  do_dlopen + 0x34' },
      { seq: 23, cat: 'sys', badge: '系统', algo: 'dlopen', op: 'loaded', time: '2026-08-01 15:31:57.951', inLen: 0, outLen: 0, preview: '/usr/lib/libsqlite3.dylib', input: '/usr/lib/libsqlite3.dylib', output: '', stack: '0  CryptoTestHost  do_dlopen + 0x1c' },
      { seq: 22, cat: 'file', badge: '文件', algo: 'write', op: '56 bytes', time: '2026-08-01 15:31:57.847', inLen: 0, outLen: 0, preview: 'Documents/iosdh_test.txt', input: 'Documents/iosdh_test.txt', output: '', stack: '0  CryptoTestHost  do_file_write + 0x88' },
      { seq: 21, cat: 'file', badge: '文件', algo: 'open', op: '写|创建|截断', time: '2026-08-01 15:31:57.843', inLen: 0, outLen: 0, preview: 'Documents/iosdh_test.txt', input: 'Documents/iosdh_test.txt', output: '', stack: '0  CryptoTestHost  do_file_write + 0x50' },
      { seq: 20, cat: 'file', badge: '文件', algo: 'rename', op: 'iosdh_test.txt -> iosdh_test.txt.bak', time: '2026-08-01 15:31:57.752', inLen: 0, outLen: 0, preview: 'Documents/iosdh_test.txt.bak', input: 'Documents/iosdh_test.txt', output: 'Documents/iosdh_test.txt.bak', stack: '0  CryptoTestHost  do_file_rename + 0xa8' },
      { seq: 19, cat: 'file', badge: '文件', algo: 'rename', op: '.dat.nosync -> iosdh_test.txt', time: '2026-08-01 15:31:57.746', inLen: 0, outLen: 0, preview: 'Documents/iosdh_test.txt', input: 'Documents/.dat.nosync', output: 'Documents/iosdh_test.txt', stack: '0  Foundation  writeToFile:atomically: + 0x0' },
      { seq: 18, cat: 'file', badge: '文件', algo: 'write', op: '11 bytes', time: '2026-08-01 15:31:57.742', inLen: 0, outLen: 0, preview: 'Documents/.dat.nosync', input: 'Documents/.dat.nosync', output: '', stack: '0  Foundation  writeToFile:atomically: + 0x0' },
      { seq: 17, cat: 'file', badge: '文件', algo: 'open', op: '读写|创建', time: '2026-08-01 15:31:57.735', inLen: 0, outLen: 0, preview: 'Documents/.dat.nosync', input: 'Documents/.dat.nosync', output: '', stack: '0  Foundation  writeToFile:atomically: + 0x0' },
      { seq: 16, cat: 'file', badge: '文件', algo: 'read', op: '56 bytes', time: '2026-08-01 15:31:57.632', inLen: 56, outLen: 0, preview: 'IOSDecryptHub file hook test - 文件操作测试数据', input: 'IOSDecryptHub file hook test - 文件操作测试数据\n', output: '', stack: '0  CryptoTestHost  do_file_read + 0x70\n1  CryptoTestHost  -[TestVC onFRead] + 0x18' },
      { seq: 15, cat: 'file', badge: '文件', algo: 'open', op: '读', time: '2026-08-01 15:31:57.628', inLen: 0, outLen: 0, preview: 'Documents/iosdh_test.txt', input: 'Documents/iosdh_test.txt', output: '', stack: '0  CryptoTestHost  do_file_read + 0x38' },
      { seq: 14, cat: 'file', badge: '文件', algo: 'write', op: '56 bytes', time: '2026-08-01 15:31:57.519', inLen: 0, outLen: 0, preview: 'Documents/iosdh_test.txt', input: 'Documents/iosdh_test.txt', output: '', stack: '0  CryptoTestHost  do_file_write + 0x88' },
      { seq: 13, cat: 'file', badge: '文件', algo: 'open', op: '写|创建|截断', time: '2026-08-01 15:31:57.515', inLen: 0, outLen: 0, preview: 'Documents/iosdh_test.txt', input: 'Documents/iosdh_test.txt', output: '', stack: '0  CryptoTestHost  do_file_write + 0x50' },
    ],
  },
  {
    key: 'net', label: '网络',
    rows: [{ seq: 38, cat: 'net', badge: '网络', algo: 'HTTP', op: 'POST', time: '2026-08-01 15:31:58.190', inLen: 45, outLen: 9, preview: '{"probe":"network-capture","secret":"s3cr3t"}', input: '{"probe":"network-capture","secret":"s3cr3t"}', output: 'not found', stack: '0  CryptoTestHost  do_network + 0x2dc\n1  CryptoTestHost  triggerScenarioById: + 0x238' }],
  },
  {
    key: 'keychain', label: 'Keychain',
    rows: [
      { seq: 139, cat: 'keychain', badge: 'Keychain', algo: 'SecItemDelete', op: 'status=0', time: '2026-07-24 12:00:06.176', inLen: 0, outLen: 0, preview: 'service=com.dh.probe.service · account=probe-account', input: 'service=com.dh.probe.service · account=probe-account', output: 'errSecSuccess', stack: '0  exercise_runner  test_keychain + 0x230' },
      { seq: 138, cat: 'keychain', badge: 'Keychain', algo: 'SecItemUpdate', op: 'status=0', time: '2026-07-24 12:00:06.171', inLen: 17, outLen: 0, preview: 'kc-secret-ROTATED', input: 'kc-secret-ROTATED', output: 'errSecSuccess', stack: '0  exercise_runner  test_keychain + 0x1d4' },
      { seq: 137, cat: 'keychain', badge: 'Keychain', algo: 'SecItemCopyMatching', op: 'status=0', time: '2026-07-24 12:00:06.166', inLen: 0, outLen: 22, preview: 'kc-secret-token-9f8e7d', input: 'service=com.dh.probe.service · account=probe-account', output: 'kc-secret-token-9f8e7d', stack: '0  exercise_runner  test_keychain + 0x154' },
      { seq: 136, cat: 'keychain', badge: 'Keychain', algo: 'SecItemAdd', op: 'status=0', time: '2026-07-24 12:00:06.160', inLen: 22, outLen: 0, preview: 'kc-secret-token-9f8e7d', input: 'kc-secret-token-9f8e7d', output: 'errSecSuccess', stack: '0  exercise_runner  test_keychain + 0xd0' },
      { seq: 135, cat: 'keychain', badge: 'Keychain', algo: 'SecItemDelete', op: 'status=-25300', time: '2026-07-24 12:00:06.154', inLen: 0, outLen: 0, preview: '清理测试条目', input: 'service=com.dh.probe.service · account=probe-account', output: 'errSecItemNotFound', stack: '0  exercise_runner  test_keychain + 0x70' },
    ],
  },
  { key: 'files', label: '文件', kind: 'files' },
  { key: 'symbols', label: '符号', kind: 'symbols' },
  { key: 'dump', label: 'Dump', kind: 'dump' },
];

export const PANEL_FILES = [
  { path: 'Documents', name: 'Documents', type: 'dir', depth: 0 },
  { path: 'Documents/iosdh_test.txt', name: 'iosdh_test.txt', type: 'file', depth: 1, size: 56, content: 'IOSDecryptHub file hook test - 文件操作测试数据\n' },
  { path: 'Documents/iosdh_test.txt.bak', name: 'iosdh_test.txt.bak', type: 'file', depth: 1, size: 11, content: 'rename test' },
  { path: 'Documents/decrypt_helper.log', name: 'decrypt_helper.log', type: 'file', depth: 1, size: 99339, content: '[15:31:55.374] #1 digest MD5 in=38 out=16\n[15:31:55.393] #6 sym AES-128-CBC-PKCS7 in=38 out=48\n[15:31:57.632] #16 file read 56 bytes\n[15:31:58.190] #38 net HTTP POST' },
  { path: 'Library', name: 'Library', type: 'dir', depth: 0 },
  { path: 'Library/Caches', name: 'Caches', type: 'dir', depth: 1 },
  { path: 'Library/HTTPStorages', name: 'HTTPStorages', type: 'dir', depth: 1 },
  { path: 'Library/Preferences', name: 'Preferences', type: 'dir', depth: 1 },
  { path: 'Library/Saved Application State', name: 'Saved Application State', type: 'dir', depth: 1 },
  { path: 'tmp', name: 'tmp', type: 'dir', depth: 0 },
];

export const PANEL_SYMBOL_IMAGES = [
  { idx: 0, name: 'CryptoTestHost', imports: 119, kind: '主程序' },
  { idx: 3, name: 'Security', imports: 1205, kind: 'Framework' },
  { idx: 2, name: 'Foundation', imports: 4303, kind: 'Framework' },
  { idx: 6, name: 'libSystem.B.dylib', imports: 76, kind: 'dylib' },
];

export const PANEL_SYMBOLS = {
  0: ['CCCrypt', 'CCHmac', 'CCKeyDerivationPBKDF', 'CC_MD5', 'CC_SHA1', 'CC_SHA256', 'CC_SHA512', 'CFDataCreate', 'CFRelease', 'NSLog', 'NSSearchPathForDirectoriesInDomains', 'NSSelectorFromString', 'NSStringFromClass', 'OBJC_CLASS_$_ASIdentifierManager', 'OBJC_CLASS_$_NSArray', 'OBJC_CLASS_$_NSData', 'OBJC_CLASS_$_NSDictionary', 'OBJC_CLASS_$_NSMutableDictionary', 'OBJC_CLASS_$_NSMutableURLRequest', 'SecKeyCopyPublicKey', 'SecKeyCreateEncryptedData', 'SecKeyCreateRandomKey', 'SecKeyCreateSignature', 'dlclose', 'dlopen', 'dlsym', 'open', 'read', 'write'],
  3: ['AnalyticsSendEvent', 'AnalyticsSendEventLazy', 'CCCrypt', 'CCCryptorCreate', 'CCCryptorFinal', 'CCCryptorGetOutputLength', 'CCCryptorRelease', 'CCCryptorUpdate', 'CCDigest', 'CCDigestCreate', 'CCDigestDestroy', 'CCDigestFinal'],
  2: ['$s10ObjectiveC8ObjCBoolVMn', '$s10ObjectiveC8SelectorVMn', '$s10ObjectiveC8SelectorVyACSScfC', '$s11RawExponentSBTl', '$s11RegexOutput17_StringProcessing0A9ComponentPTl', '$s11SubSequenceSlTl', '$s12CoreGraphics7CGFloatVMn', '$s12CoreGraphics7CGFloatVN', '$s12CoreGraphics7CGFloatVSEAAMc', '$s12CoreGraphics7CGFloatVSQAAMc', '$s12CoreGraphics7CGFloatVSeAAMc', '$s12CoreGraphics7CGFloatVs7CVarArgAAMc', '$s13AsyncIteratorSciTl', '$s14CoreFoundation9_CFObjectMp', '$s14CoreFoundation9_CFObjectPAAE2eeoiySbx_xtFZ', '$s14CoreFoundation9_CFObjectPAAE4hash4intoys6HasherVz_tF', '$s14CoreFoundation9_CFObjectPAAE9hashValueSivg', '$s14CoreFoundation9_CFObjectPSHTb', '$s14RawSignificandSBTl', '$s15RuntimeInternal12TypeMetadataV8_resolveyAA0D0VSgAA07MangledC9ReferenceVF'],
  6: ['__error', '__init_libsystem_sim_kernel', '__init_libsystem_sim_platform', '__init_libsystem_sim_pthread', '__libdarwin_init', '__libkernel_init', '__libplatform_init', '__malloc_init', '__malloc_late_init', '__pthread_init', '__pthread_late_init', '_asl_fork_child', '_container_init', '_dirhelper', '_dyld_atfork_parent', '_dyld_atfork_prepare', '_dyld_dlopen_atfork_child', '_dyld_dlopen_atfork_parent', '_dyld_dlopen_atfork_prepare', '_dyld_fork_child'],
};

export const PANEL_DUMP_IMAGES = [
  { name: 'CryptoTestHost', kind: '主程序', size: 139232, cryptid: 0, encrypted: false },
];

