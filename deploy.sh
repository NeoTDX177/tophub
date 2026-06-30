#!/bin/bash
# ============================================================
# TopHub 一键部署到 GitHub Pages
# 使用方法：
#   1. 先在 https://github.com/new 创建一个空仓库，名字叫 tophub
#   2. 编辑下面 GITHUB_USER 填上你的 GitHub 用户名
#   3. 在 Git Bash 里执行:  bash deploy.sh
# ============================================================

set -e

GITHUB_USER="NeoTDX177"   # ← 改成你的 GitHub 用户名
REPO_NAME="tophub"

cd "$(dirname "$0")"

echo "📦 Step 1: git init"
if [ ! -d ".git" ]; then
  git init
fi

echo "📝 Step 2: 配置 git 用户"
git config user.name  "tophub-bot" 2>/dev/null || true
git config user.email "tophub-bot@users.noreply.github.com" 2>/dev/null || true

echo "➕ Step 3: 添加文件"
git add .

echo "💬 Step 4: 首次提交"
if git diff --cached --quiet; then
  echo "  没有新改动"
else
  git commit -m "init: TopHub v4 with auto-refresh"
fi

echo "🌿 Step 5: 切到 main 分支"
git branch -M main 2>/dev/null || true

echo "🔗 Step 6: 配置 remote"
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo "🚀 Step 7: 推送到 GitHub"
git push -u origin main

echo ""
echo "✅ 完成！接下来："
echo "   1. 打开 https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/pages"
echo "   2. Source 选 'GitHub Actions'"
echo "   3. 等 1-2 分钟，访问 https://${GITHUB_USER}.github.io/${REPO_NAME}"
echo ""
echo "📱 手机访问：浏览器打开后 → 分享 → 添加到主屏幕"
