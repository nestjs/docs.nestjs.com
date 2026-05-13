#!/usr/bin/env bash
set -euo pipefail

BIN_DIR="$(cd "$(dirname "$0")/.." && pwd)/bin"
RG_VERSION="14.1.1"

mkdir -p "$BIN_DIR"

detect_arch() {
  local arch
  arch="$(uname -m)"
  case "$arch" in
    x86_64|amd64) echo "x86_64" ;;
    aarch64|arm64) echo "aarch64" ;;
    *) echo "unknown" ;;
  esac
}

ARCH="$(detect_arch)"
if [ "$ARCH" = "unknown" ]; then
  echo "[mcp] Unknown architecture, skipping ripgrep download"
  echo "[mcp] Users can install rg via their package manager"
  exit 0
fi

TARBALL="ripgrep-${RG_VERSION}-${ARCH}-unknown-linux-musl.tar.gz"
URL="https://github.com/BurntSushi/ripgrep/releases/download/${RG_VERSION}/${TARBALL}"

if [ -f "$BIN_DIR/rg" ] && [ -x "$BIN_DIR/rg" ]; then
  existing="$("$BIN_DIR/rg" --version 2>/dev/null | head -1 | grep -oP '\d+\.\d+\.\d+' || true)"
  if [ "$existing" = "$RG_VERSION" ]; then
    echo "[mcp] ripgrep $RG_VERSION already installed in $BIN_DIR"
    exit 0
  fi
fi

echo "[mcp] Downloading ripgrep ${RG_VERSION} for ${ARCH}..."
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if curl -sL "$URL" -o "$TMP_DIR/ripgrep.tar.gz"; then
  tar -xzf "$TMP_DIR/ripgrep.tar.gz" -C "$TMP_DIR"
  cp "$TMP_DIR/ripgrep-${RG_VERSION}-${ARCH}-unknown-linux-musl/rg" "$BIN_DIR/rg"
  chmod +x "$BIN_DIR/rg"
  "$BIN_DIR/rg" --version
  echo "[mcp] ripgrep installed at $BIN_DIR/rg"
else
  echo "[mcp] Failed to download ripgrep (no network?); continuing without it"
fi
