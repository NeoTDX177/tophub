# 一键部署到 GitHub Pages

## 步骤

1. **建空仓库**：去 https://github.com/new 创建一个名字叫 `tophub` 的仓库，**什么都不要勾**（不要 README、不要 .gitignore、不要 license）
2. **改用户名**：打开 `deploy.sh`，把 `YOUR_GITHUB_USERNAME` 改成你的 GitHub 用户名
3. **执行脚本**：在项目目录的 Git Bash 里跑：
   ```bash
   bash deploy.sh
   ```
4. **开启 Pages**：在 GitHub 仓库 Settings → Pages → Source 选 **GitHub Actions**
5. **等 1-2 分钟**，访问 `https://你的用户名.github.io/tophub` 就能用

## 进阶：开启 LLM 自动解读

GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret

| Name | Value |
|------|-------|
| `OPENAI_API_KEY` | `sk-xxxxxxxxxxxxxxxx` |

之后每天 9 点（北京时间）LLM 会自动给项目写最新解读。

## 手机使用

浏览器打开 → 分享 → "添加到主屏幕" → 全屏 App 体验。
