// Shared content data for IOSDecryptHub site.

export const MARQUEE = [
  'CommonCrypto', 'Security.framework', 'OpenSSL EVP', 'fishhook', 'Capstone 5.0.1',
  'FairPlay dump', 'CCCryptor', 'SecKey', 'PBKDF2', 'dlsym redirect', 'Mach-O', 'MCP / JSON-RPC',
];

const ICON = {
  crypto: '<path d="M12 2 3 6v6c0 5 3.5 8.5 9 10 5.5-1.5 9-5 9-10V6l-9-4Z" stroke="currentColor" stroke-width="1.6"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  file: '<path d="M6 3h8l4 4v14H6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 3v4h4M9 13h6M9 16h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  system: '<rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M9 9h6v6H9zM9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  dump: '<path d="M12 3v11m0 0 4-4m-4 4-4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  mcp: '<circle cx="6" cy="12" r="2.4" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="6" r="2.4" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="18" r="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M8 11 16 7M8 13l8 4" stroke="currentColor" stroke-width="1.6"/>',
  health: '<path d="M3 12h4l2-6 4 12 2-6h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
};

export const CAPABILITIES = [
  {
    icon: ICON.crypto, title: '加解密审计',
    desc: '拦截 CommonCrypto / SecKey / OpenSSL EVP：解析算法、Key、IV、明文、密文，一次性与流式都覆盖，每条附应用层调用栈。',
    tags: ['摘要', 'HMAC', '对称', '非对称', 'KDF'],
  },
  {
    icon: ICON.file, title: '文件监控',
    desc: '钩住 open / write / unlink / rename，看清 App 在沙盒里读写、删除、重命名了哪些文件，并过滤系统噪音。',
    tags: ['open', 'write', 'unlink', 'rename'],
  },
  {
    icon: ICON.system, title: '系统模块',
    desc: 'dlopen 载入的动态库、dlsym 动态符号解析全程可见；对已 hook 符号把 dlsym 结果重定向到 wrapper，堵住函数指针旁路。',
    tags: ['dlopen', 'dlsym', 'redirect'],
  },
  {
    icon: ICON.dump, title: '砸壳 / 脱壳',
    desc: '在进程内对内核已解密的 Mach-O 按需脱壳，产出裸 .decrypted 供静态分析，或重打包成可重签 IPA。零依赖 zip 写入。',
    tags: ['FairPlay', 'cryptid=0', '.decrypted', 'IPA'],
  },
  {
    icon: ICON.mcp, title: 'MCP 静态分析',
    desc: '进程内 MCP 服务器暴露 Capstone 反汇编、镜像枚举与 xref 四件套，AI 客户端可直接调用来读真实运行时代码。',
    tags: ['disassemble', 'xref', 'objc IMP'],
  },
  {
    icon: ICON.health, title: 'fail-loud 健康监控',
    desc: '每个 hook 安装后自检，没挂上的符号、起不来的服务、落盘失败都上报。悬浮窗 / 面板 / 控制台三处同时可见。',
    tags: ['self-check', '/api/stats', 'health'],
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
  { title: '摘要 Digest', note: '一次性 + 流式 Init/Update/Final', items: ['MD2', 'MD4', 'MD5', 'SHA1', 'SHA224', 'SHA256', 'SHA384', 'SHA512'] },
  { title: 'HMAC', note: 'CCHmac 系列', items: ['HMAC-MD5', 'HMAC-SHA1', 'HMAC-SHA256', 'HMAC-SHA384', 'HMAC-SHA512'] },
  { title: '对称 Symmetric', note: 'CCCrypt / CCCryptor · 自动识别模式与填充', items: ['AES', 'DES', '3DES', 'RC4', 'RC2', 'CAST', 'Blowfish', 'ECB', 'CBC', 'CTR', 'CFB', 'OFB', 'PKCS7'] },
  { title: 'OpenSSL EVP', note: '目标链接 libcrypto 时', items: ['AES-GCM', 'AES-CBC', 'ChaCha20-Poly1305', 'SM4', 'Camellia', 'DES/3DES', 'CCM', 'AAD/tag'] },
  { title: '非对称 Asymmetric', note: 'SecKey 系列', items: ['RSA sign', 'RSA verify', 'RSA encrypt', 'RSA decrypt', 'EC sign', 'EC verify'] },
  { title: '密钥派生 KDF', note: '记录口令 / salt / 迭代', items: ['PBKDF2', 'PRF-SHA256', 'salt', 'iterations'] },
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

const compactTool = (name, tier, req, desc, args, result) => ({
  name, tier, req, desc,
  in: JSON.stringify({ name, arguments: args }, null, 2),
  out: JSON.stringify(result, null, 2),
});

export const MCP_TOOLS = [
  {
    name: 'disassemble', tier: 'tier-0', req: 'bytes',
    desc: '反汇编一段 hex 字节，容忍空格与 0x 前缀。arch 默认 arm64，也支持 arm / thumb。',
    in: '{\n  "name": "disassemble",\n  "arguments": {\n    "bytes": "fd7bbfa9 fd030091 c0035fd6",\n    "arch": "arm64"\n  }\n}',
    out: '{ "count": 3, "instructions": [\n  { "address":"0x0","mnemonic":"stp","op_str":"x29, x30, [sp, #-0x10]!" },\n  { "address":"0x4","mnemonic":"mov","op_str":"x29, sp" },\n  { "address":"0x8","mnemonic":"ret","op_str":"" }\n] }',
  },
  {
    name: 'analyze_function', tier: 'tier-0', req: 'address, size',
    desc: '安全读取进程内存 address..+size 并反汇编，vm_read_overwrite 防护，不可读地址返回 isError 而非崩溃。',
    in: '{\n  "name": "analyze_function",\n  "arguments": {\n    "address": "0x1029ac000",\n    "size": 64\n  }\n}',
    out: '{ "count": 16, "base": "0x1029ac000",\n  "instructions": [\n    { "address":"0x1029ac000","mnemonic":"sub","op_str":"sp, sp, #0x40" },\n    { "address":"0x1029ac004","mnemonic":"stp","op_str":"x29, x30, [sp, #0x30]" }\n  ] }',
  },
  {
    name: 'get_macho_info', tier: 'tier-0', req: '—',
    desc: '列举 App bundle 内已加载镜像：load_address、cryptid、加密状态。砸壳与 analyze_function 的地址起点。',
    in: '{ "name": "get_macho_info", "arguments": {} }',
    out: '{ "images": [\n  { "name":"MyApp","load_address":"0x1029a8000","cryptid":1,"encrypted":true },\n  { "name":"Frameworks/Core.dylib","load_address":"0x10a1c0000","cryptid":1 }\n] }',
  },
  {
    name: 'list_imports', tier: 'tier-0', req: 'image_index',
    desc: '列举某镜像的导入（undefined）符号——fishhook 可 rebind 的候选。支持 query 子串过滤。',
    in: '{\n  "name": "list_imports",\n  "arguments": { "image_index": 0, "query": "CC" }\n}',
    out: '{ "count": 4, "symbols": [\n  "CCCrypt","CCHmac","CC_SHA256_Init","CCKeyDerivationPBKDF"\n] }',
  },
  {
    name: 'find_xrefs', tier: 'tier-1', req: 'symbol 或 address',
    desc: '「谁调用了它」：扫 __text 里所有直接 bl 到目标的调用点，经运行时 GOT + dladdr 把 import stub 还原成真实符号。',
    in: '{\n  "name": "find_xrefs",\n  "arguments": { "symbol": "CCCrypt" }\n}',
    out: '{ "count": 2, "xrefs": [\n  { "call_site":"0x1029b120","from_func":"-[SessionCipher encrypt:]+0x88","kind":"call_import_stub","resolved_name":"hook_CCCrypt" }\n] }',
  },
  {
    name: 'find_string_refs', tier: 'tier-2A', req: 'string 或 address',
    desc: '「谁引用了这个字符串」：恢复 ADRP+ADD（直接）/ ADRP+LDR（间接指针槽）的数据地址，落在字符串 section 则记引用点。',
    in: '{\n  "name": "find_string_refs",\n  "arguments": { "string": "password" }\n}',
    out: '{ "count": 1, "refs": [\n  { "ref_site":"0x1029c044","string":"password","section":"__cstring","indirect":false,"from_func":"-[LoginVM submit]+0x2c" }\n] }',
  },
  {
    name: 'find_selector_refs', tier: 'tier-2B', req: 'selector',
    desc: '「谁把这个 selector 用在了 objc 调用上」：xref 站点是 objc_msgSend 的 call_site，不报裸 selref 加载。',
    in: '{\n  "name": "find_selector_refs",\n  "arguments": { "selector": "setRawT:" }\n}',
    out: '{ "count": 1, "refs": [\n  { "call_site":"0x1029d180","selector":"setRawT:","target_kind":"objc_stub","from_func":"-[WBValidator run]+0x40" }\n] }',
  },
  {
    name: 'find_function_refs', tier: 'tier-3A', req: 'target',
    desc: '内部调用图：本镜像 __text 内 BL 的 from_func → to_func 边，direction 取 callers / callees / both。',
    in: '{\n  "name": "find_function_refs",\n  "arguments": { "target": "0x1029ac000", "direction": "callers" }\n}',
    out: '{ "count": 3, "edges": [\n  { "relation":"caller","from_func":"-[APIClient sign:]","to_func_start":"0x1029ac000","call_site":"0x1029b0f4" }\n] }',
  },
  {
    name: 'list_functions', tier: 'tier-3B', req: '—',
    desc: '函数清单（LC_FUNCTION_STARTS）：name（符号或 sub_addr）、start、vmaddr、size。strip 后仍可列出。',
    in: '{\n  "name": "list_functions",\n  "arguments": { "query": "cipher", "limit": 3 }\n}',
    out: '{ "count": 3, "functions": [\n  { "name":"-[SessionCipher encrypt:]","start":"0x1029ac000","vmaddr":"0x4000","size":184 }\n] }',
  },
  {
    name: 'objc_resolve_imp', tier: 'tier-4', req: 'selector + class/object',
    desc: 'selector → 运行时真实 IMP：破 objc 动态派发。给类名或活对象地址 + selector，返回 IMP、声明类、image、dladdr 符号。',
    in: '{\n  "name": "objc_resolve_imp",\n  "arguments": {\n    "class": "WBValidatorModel",\n    "selector": "setRawT:"\n  }\n}',
    out: '{ "found": true,\n  "imp": "0x10a1c4d20",\n  "resolving_class": "WBValidatorModel",\n  "image": "Frameworks/Core.dylib",\n  "symbol": "-[WBValidatorModel setRawT:]" }',
  },
  compactTool('disassemble_function', 'analysis', 'address', '从运行时地址开始反汇编，遇到 ret 或达到 max_bytes 时停止，适合读取完整函数。',
    { address: '0x1029ac000', max_bytes: 4096 }, { count: 42, stop_reason: 'ret', base: '0x1029ac000' }),
  compactTool('resolve_symbol', 'analysis', 'name', '通过 dlsym 把导出符号名解析为运行时地址，可直接交给 disassemble_function。',
    { name: 'CCCrypt' }, { found: true, address: '0x1a42b8130', image: 'libcommonCrypto.dylib' }),
  compactTool('symbolicate', 'analysis', 'address', '通过 dladdr 把运行时地址解析为最近符号、镜像与偏移。',
    { address: '0x1029ac1f8' }, { found: true, symbol: '-[SessionCipher encrypt:]', offset: 504, image: 'CryptoTestHost' }),
  compactTool('read_memory', 'memory', 'address', '安全读取进程数据内存，返回 Hex、ASCII 和 HexDump，适合检查 Key、常量与结构体。',
    { address: '0x1029bc000', size: 64 }, { address: '0x1029bc000', size: 64, hex: '7365637265742d6b6579…', ascii: 'secret-key' }),
  compactTool('search_memory', 'memory', 'address, length', '在指定内存范围内搜索 UTF-8 字符串或十六进制字节模式，自动跳过不可读页。',
    { address: '0x1029a8000', length: 16777216, string: 'user-password' }, { count: 1, hits: ['0x102a7c118'] }),
  compactTool('list_images', 'analysis', '—', '列出全部已加载镜像及其独立 image_index；调用 list_imports 前应先使用本工具。',
    {}, { count: 84, images: [{ index: 0, name: 'CryptoTestHost', load_address: '0x1029a8000' }] }),
  compactTool('get_stats', 'forensic', '—', '取证总览：各分类事件数、捕获开关、宿主进程、Hook 健康、落盘大小与噪声统计。',
    {}, { total: 141, counts: { crypto: 67, sys: 25, net: 2, keychain: 4 }, health: { installed: 124, failed: 0 } }),
  compactTool('query_events', 'forensic', '—', '检索加解密、文件、系统、网络与 Keychain 事件；返回最新优先的摘要，可按大小、时间、线程和输出过滤。',
    { category: 'sym', query: 'AES', min_size: 16, limit: 20 }, { count: 2, events: [{ seq: 118, algorithm: 'AES-128-CBC', operation: 'encrypt', inLen: 53 }] }),
  compactTool('correlate_request', 'forensic', 'net_seq', '以网络请求为锚点，聚合时间窗口内的加解密与 Keychain 事件，并反查 Base64 请求头对应的输出。',
    { net_seq: 141, window_ms: 300, match_header: 'X-Validator' }, { anchor: 141, match: { header: 'X-Validator', event_seq: 139, algorithm: 'SHA256' } }),
  compactTool('get_event', 'forensic', 'seq', '按 seq 获取完整事件：算法、Key、IV、明文、密文、HexDump 与结构化调用栈。',
    { seq: 118 }, { seq: 118, algorithm: 'AES-128-CBC', inputUtf8: 'the answer is 42…', keyHex: '00112233…', callStackFrames: 2 }),
  compactTool('query_noise', 'forensic', '—', '查询被噪声规则从主事件流分流的高频事件。',
    { board: 'crypto', query: 'MGCopyAnswer', limit: 100 }, { count: 1, events: [{ seq: 110, algorithm: 'MD5', preview: 'MGCopyAnswerapple-internal-install' }] }),
  compactTool('list_files', 'sandbox', '—', '列出宿主 App 沙盒 Documents、Library、tmp 下的文件与目录。',
    { path: 'Documents' }, { path: 'Documents', entries: [{ name: 'iosdh_test.txt', type: 'file', size: 59 }] }),
  compactTool('read_file', 'sandbox', 'path', '预览沙盒文件，文本返回 UTF-8，否则返回 HexDump。',
    { path: 'Documents/iosdh_test.txt', limit: 4096 }, { path: 'Documents/iosdh_test.txt', size: 59, utf8: 'IOSDecryptHub file hook test - 文件操作测试数据' }),
  compactTool('dump_status', 'dump', '—', '列出当前进程内可脱壳的 App Bundle Mach-O，并返回异步砸壳任务状态。',
    {}, { state: 'idle', images: [{ name: 'CryptoTestHost', encrypted: true, cryptid: 1, size: 25480396 }] }),
  compactTool('set_capture', 'control', 'name, enabled', '按 Hook 函数粒度启用或停用捕获；可用名称来自 get_stats.capture。',
    { name: 'CCCrypt', enabled: false }, { ok: true, name: 'CCCrypt', enabled: false }),
  compactTool('set_pause', 'control', 'paused', '全局或按分类暂停/继续事件记录。',
    { category: 'sym', paused: true }, { ok: true, category: 'sym', paused: true }),
  compactTool('clear_events', 'control', '—', '清空内存中的事件；落盘日志不受影响，仍可下载。',
    { category: 'crypto' }, { ok: true, category: 'crypto', cleared: 67 }),
  compactTool('start_dump', 'control', '—', '触发设备端异步脱壳，可选裸解密二进制或可重签 IPA；进度用 dump_status 查询。',
    { mode: 'ipa' }, { accepted: true, task_id: 'dump-7', state: 'running' }),
  compactTool('get_spoof', 'config', '—', '读取越狱隐藏、反调试与设备参数伪装配置。',
    {}, { jailbreak: { enabled: true, paths: ['/var/jb'] }, anti_debug: { enabled: true }, device: { enabled: false } }),
  compactTool('set_spoof', 'config', 'group, op', '修改反检测配置：越狱路径/URL Scheme/注入镜像隐藏、反调试或设备参数伪装。',
    { group: 'anti', op: 'enable', on: true }, { ok: true, anti_debug: { enabled: true } }),
  compactTool('get_noise_config', 'config', '—', '读取 crypto 或 sys 噪声板的开关与特征串列表。',
    { board: 'crypto' }, { board: 'crypto', enabled: true, patterns: ['MGCopyAnswer'] }),
  compactTool('set_noise_config', 'config', 'op', '启停噪声板，或添加/移除精确匹配的噪声特征串。',
    { board: 'crypto', op: 'add', text: 'CFNetworkCopySystemProxySettings' }, { ok: true, enabled: true, patterns: ['MGCopyAnswer', 'CFNetworkCopySystemProxySettings'] }),
  compactTool('clear_noise', 'control', '—', '清空指定噪声板的内存事件；落盘记录不变。',
    { board: 'crypto' }, { ok: true, board: 'crypto', cleared: 1 }),
  compactTool('get_config', 'config', '—', '读取内存事件保留数与落盘日志文件上限。',
    {}, { maxEntries: 5000, maxFileBytes: 52428800, logBytes: 184320 }),
  compactTool('set_config', 'config', '—', '修改内存保留与落盘滚动配置，并返回更新后的快照。',
    { maxEntries: 10000, maxFileBytes: 104857600 }, { ok: true, maxEntries: 10000, maxFileBytes: 104857600 }),
  compactTool('get_diag', 'diagnostic', '—', '获取 Hook 健康、持久化和服务事件的审查时间线，以及未成功 Hook 的符号清单。',
    { board: 'crypto' }, { board: 'crypto', diag: '[14:32:17] digest hooks 24/24\n[14:32:17] symmetric hooks 6/6', unhooked: '' }),
];

export const START_STEPS = [
  { b: '编译出 dylib', p: '一条命令产出 <code>decrypt_helper.dylib</code>，只编 ARM/AArch64，约 2MB。' },
  { b: '注入目标 IPA', p: '脚本用 insert_dylib 写入 LC_LOAD_DYLIB，产出 <code>hooked_&lt;input&gt;.ipa</code>。' },
  { b: '打开面板', p: '安装运行后浏览器访问 <code>http://&lt;设备IP&gt;:8088</code>，事件实时流出。' },
];

export const START_TABS = [
  {
    name: '编译',
    code: '<span class="c"># iOS 真机 (arm64, iPhoneOS SDK)</span>\nmake\n\n<span class="c"># macOS 原生灰度自测</span>\nmake mac\n\n<span class="c"># iOS 模拟器 + 一键部署测试 App</span>\nmake sim-install',
  },
  {
    name: '注入',
    code: '<span class="c"># 写入 LC_LOAD_DYLIB → hooked_&lt;input&gt;.ipa</span>\n<span class="p">./scripts/inject.sh</span> <span class="s">app.ipa</span> decrypt_helper.dylib\n\n<span class="c"># 非越狱：AltStore / Sideloadly 重签后安装</span>\n<span class="c"># 越狱设备：可直接安装</span>',
  },
  {
    name: '打开面板',
    code: '<span class="c"># dylib 加载后自动起 HTTP 服务</span>\nopen <span class="s">http://&lt;设备IP&gt;:8088</span>\n\n<span class="c"># AI 客户端接 MCP（复用同端口）</span>\nPOST <span class="s">http://&lt;设备IP&gt;:8088/api/mcp</span>',
  },
];

export const TERM_LINES = [
  { t: '$ ./scripts/inject.sh Target.ipa decrypt_helper.dylib', c: '' },
  { t: '  → insert_dylib: LC_LOAD_DYLIB written', c: 'c-mut' },
  { t: '  ✓ hooked_Target.ipa', c: 'c-ok' },
  { t: '$ install & launch on device', c: '' },
  { t: '[IOSDecryptHub] hooks installed: 124/124', c: 'c-ok' },
  { t: '[IOSDecryptHub] http server on 0.0.0.0:8088', c: 'c-ok' },
  { t: '', c: '' },
  { t: '# App calls CCCrypt(...)', c: 'c-mut' },
  { t: 'AES-256-CBC  key=a3f1…7e0b  iv=0011…eeff', c: 'c-key' },
  { t: 'plain: {"token":"sk_live_9f2a","uid":42}', c: 'c-ok' },
  { t: '# App calls SecKeyCreateSignature(...)', c: 'c-mut' },
  { t: 'RSA-2048  sign  256 B  ✓ captured', c: 'c-key' },
  { t: 'health: hookFailures=0  sink=ok', c: 'c-warn' },
];
