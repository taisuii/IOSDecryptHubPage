#!/bin/bash
# update_repo.sh — 更新 Cydia/Sileo 源索引
#
# 用法:
#   ./scripts/update_repo.sh          ← 从 public/debs/ 扫描所有 .deb 重建索引
#   ./scripts/update_repo.sh add <path.deb>  ← 复制 deb 到 public/debs/ 并重建索引
#
# 产物 (均在 public/ 下):
#   Packages, Packages.gz, Packages.bz2, Release
#
# 前提: dpkg-deb (brew install dpkg), gzip, bzip2

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PAGE_DIR="$(dirname "$SCRIPT_DIR")"
PUBLIC_DIR="$PAGE_DIR/public"
DEBS_DIR="$PUBLIC_DIR/debs"

# 源元数据
REPO_ORIGIN="IOSDecryptHub"
REPO_LABEL="IOSDecryptHub"
REPO_SUITE="stable"
REPO_VERSION="1.0"
REPO_CODENAME="ios"
REPO_ARCH="iphoneos-arm64"
REPO_COMPONENT="main"
REPO_DESC="IOSDecryptHub - iOS Runtime Security Analysis Tool"
REPO_URL="https://ios.decrypthub.com"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[*]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

command -v dpkg-deb >/dev/null 2>&1 || error "需要 dpkg-deb (brew install dpkg)"

# ---------- add 子命令 ----------
if [ "${1:-}" = "add" ]; then
    [ -z "${2:-}" ] && error "用法: $0 add <path.deb>"
    SRC_DEB="$2"
    [ -f "$SRC_DEB" ] || error "文件不存在: $SRC_DEB"
    mkdir -p "$DEBS_DIR"
    cp "$SRC_DEB" "$DEBS_DIR/"
    info "已复制 $(basename "$SRC_DEB") → public/debs/"
fi

# ---------- 扫描 debs ----------
mkdir -p "$DEBS_DIR"
DEB_FILES=("$DEBS_DIR"/*.deb)
if [ ! -e "${DEB_FILES[0]}" ]; then
    warn "public/debs/ 下没有 .deb 文件，生成空索引"
    DEB_FILES=()
fi

# ---------- 生成 Packages ----------
PACKAGES_FILE="$PUBLIC_DIR/Packages"
> "$PACKAGES_FILE"

for deb in "${DEB_FILES[@]}"; do
    [ -e "$deb" ] || continue
    FILENAME="debs/$(basename "$deb")"
    FILESIZE=$(stat -f%z "$deb" 2>/dev/null || stat -c%s "$deb" 2>/dev/null)
    MD5=$(md5 -q "$deb" 2>/dev/null || md5sum "$deb" | cut -d' ' -f1)
    SHA1=$(shasum -a 1 "$deb" | cut -d' ' -f1)
    SHA256=$(shasum -a 256 "$deb" | cut -d' ' -f1)

    # 提取 control 字段
    CONTROL=$(dpkg-deb -f "$deb")

    # 写入 Packages 条目
    {
        echo "$CONTROL"
        echo "Filename: $FILENAME"
        echo "Size: $FILESIZE"
        echo "MD5sum: $MD5"
        echo "SHA1: $SHA1"
        echo "SHA256: $SHA256"
        # Sileo 增强
        echo "Depiction: $REPO_URL/depictions/$(dpkg-deb -f "$deb" Package)/index.html"
        echo "SileoDepiction: $REPO_URL/depictions/$(dpkg-deb -f "$deb" Package)/sileo.json"
        echo "Icon: $REPO_URL/depictions/$(dpkg-deb -f "$deb" Package)/icon.png"
        echo ""
    } >> "$PACKAGES_FILE"

    info "索引: $(basename "$deb") ($(du -h "$deb" | cut -f1))"
done

# ---------- 压缩 ----------
gzip -9kf "$PACKAGES_FILE"
bzip2 -9kf "$PACKAGES_FILE"
info "已生成 Packages / Packages.gz / Packages.bz2"

# ---------- 生成 Release ----------
RELEASE_FILE="$PUBLIC_DIR/Release"
PACKAGES_SIZE=$(stat -f%z "$PACKAGES_FILE" 2>/dev/null || stat -c%s "$PACKAGES_FILE")
PACKAGES_GZ_SIZE=$(stat -f%z "$PACKAGES_FILE.gz" 2>/dev/null || stat -c%s "$PACKAGES_FILE.gz")
PACKAGES_BZ2_SIZE=$(stat -f%z "$PACKAGES_FILE.bz2" 2>/dev/null || stat -c%s "$PACKAGES_FILE.bz2")

PACKAGES_MD5=$(md5 -q "$PACKAGES_FILE" 2>/dev/null || md5sum "$PACKAGES_FILE" | cut -d' ' -f1)
PACKAGES_GZ_MD5=$(md5 -q "$PACKAGES_FILE.gz" 2>/dev/null || md5sum "$PACKAGES_FILE.gz" | cut -d' ' -f1)
PACKAGES_BZ2_MD5=$(md5 -q "$PACKAGES_FILE.bz2" 2>/dev/null || md5sum "$PACKAGES_FILE.bz2" | cut -d' ' -f1)

PACKAGES_SHA256=$(shasum -a 256 "$PACKAGES_FILE" | cut -d' ' -f1)
PACKAGES_GZ_SHA256=$(shasum -a 256 "$PACKAGES_FILE.gz" | cut -d' ' -f1)
PACKAGES_BZ2_SHA256=$(shasum -a 256 "$PACKAGES_FILE.bz2" | cut -d' ' -f1)

cat > "$RELEASE_FILE" << RELEASE
Origin: $REPO_ORIGIN
Label: $REPO_LABEL
Suite: $REPO_SUITE
Version: $REPO_VERSION
Codename: $REPO_CODENAME
Architectures: $REPO_ARCH
Components: $REPO_COMPONENT
Description: $REPO_DESC
MD5Sum:
 $PACKAGES_MD5 $PACKAGES_SIZE Packages
 $PACKAGES_GZ_MD5 $PACKAGES_GZ_SIZE Packages.gz
 $PACKAGES_BZ2_MD5 $PACKAGES_BZ2_SIZE Packages.bz2
SHA256:
 $PACKAGES_SHA256 $PACKAGES_SIZE Packages
 $PACKAGES_GZ_SHA256 $PACKAGES_GZ_SIZE Packages.gz
 $PACKAGES_BZ2_SHA256 $PACKAGES_BZ2_SIZE Packages.bz2
RELEASE

info "已生成 Release"
info "✅ 源索引更新完成！部署后用户添加 $REPO_URL 即可安装"
