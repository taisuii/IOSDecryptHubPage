#!/usr/bin/env bash
# sync_dylib.sh — 把主项目发布版 dylib 同步到官网并更新首页下载元数据
#
# 用法:
#   ./scripts/sync_dylib.sh <path/decrypt_helper-<version>.dylib>
#   ./scripts/sync_dylib.sh        ← 自动选择 ../IOSDecryptHub 下最新的 decrypt_helper-*.dylib
#
# 产物: public/dylibs/<同名文件>, src/data.js 的 DYLIB_DOWNLOAD 元数据

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PAGE_DIR="$(dirname "$SCRIPT_DIR")"
PUBLIC_DIR="$PAGE_DIR/public"
DYLIB_DIR="$PUBLIC_DIR/dylibs"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[*]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

SRC="${1:-}"
if [ -z "$SRC" ]; then
    SRC="$(ls -t "$PAGE_DIR"/../IOSDecryptHub/decrypt_helper-*.dylib 2>/dev/null | head -1 || true)"
fi
[ -n "$SRC" ] || error "未指定 dylib，且 ../IOSDecryptHub/ 下没有 decrypt_helper-*.dylib"
[ -f "$SRC" ] || error "文件不存在: $SRC"

BASE="$(basename "$SRC")"
case "$BASE" in
    decrypt_helper-*.dylib) ;;
    *) error "文件名必须形如 decrypt_helper-<version>.dylib，收到: $BASE" ;;
esac

mkdir -p "$DYLIB_DIR"
cp "$SRC" "$DYLIB_DIR/$BASE"

VERSION="${BASE#decrypt_helper-}"
VERSION="${VERSION%.dylib}"
SIZE_MB="$(python3 -c "import os,sys; print(f'{os.path.getsize(sys.argv[1]) / 1048576:.1f} MB')" "$DYLIB_DIR/$BASE")"
SHA256="$(shasum -a 256 "$DYLIB_DIR/$BASE" | awk '{print $1}')"
URL="/dylibs/$BASE"

python3 - "$PAGE_DIR/src/data.js" "$VERSION" "$BASE" "$URL" "$SIZE_MB" "$SHA256" <<'PY'
import re
import sys

path, version, filename, url, size, sha = sys.argv[1:]
text = open(path, encoding='utf-8').read()
block = (
    "export const DYLIB_DOWNLOAD = {\n"
    f"  version: '{version}',\n"
    f"  filename: '{filename}',\n"
    f"  url: '{url}',\n"
    f"  size: '{size}',\n"
    f"  sha256: '{sha}',\n"
    "};\n"
)
pattern = re.compile(r"export const DYLIB_DOWNLOAD = \{[^}]*\};\n", re.M)
if not pattern.search(text):
    sys.exit(f"在 {path} 中未找到 DYLIB_DOWNLOAD 数据块")
open(path, 'w', encoding='utf-8').write(pattern.sub(block, text, count=1))
PY

info "已同步 $BASE → public/dylibs/ ($SIZE_MB, SHA-256 $SHA256)"
info "首页下载元数据已更新，重新构建并部署后生效"
