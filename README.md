# TopHub

> 发现 GitHub 上**真正值得追的**开源项目 —— **每日自动刷新**的深度解读。

[![Refresh Data](https://img.shields.io/badge/data-refresh%20daily-22c55e?style=flat)](.github/workflows/refresh.yml)
[![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-3b82f6?style=flat)](.github/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-MIT-8b5cf6?style=flat)](LICENSE)

## ✨ 它怎么工作

```
┌────────────────┐  cron daily   ┌─────────────────────┐
│  GitHub Actions │ ────────────▶ │  scripts/fetch-     │
│  refresh.yml    │               │  stats.mjs           │
└────────────────┘               │  调 GitHub REST API  │
        │                        │  拿真实 Star/Fork    │
        │                        └─────────┬───────────┘
        │                                  │
        │  (可选, 有 OPENAI_API_KEY 时)   │
        ▼                                  ▼
┌────────────────┐               ┌─────────────────────┐
│ generate-      │  合并 + 排序  │   projects/data.json│
│ insights.mjs   │ ────────────▶ │   +  content/*.json │
│  LLM 写解读    │               │   →  assets/data.js │
└────────────────┘               └─────────┬───────────┘
                                           │
                                  deploy.yml 触发
                                           ▼
                                 ┌─────────────────────┐
                                 │   GitHub Pages      │
                                 │   (CDN 静态托管)    │
                                 └─────────────────────┘
```

## 🗂 目录

```
tophub/
├── index.html                 # 入口 (mobile-first)
├── assets/
│   ├── app.js                 # 路由/渲染/动效
│   └── data.js                # 自动生成 — 前端直接加载
├── projects/
│   └── data.json              # 实时统计 (workflow 更新)
├── content/                   # LLM 生成的解读 (按项目 id 一文件)
│   ├── dify.json
│   ├── open-webui.json
│   └── ...
├── scripts/
│   ├── fetch-stats.mjs        # 调 GitHub API 抓真实数据
│   ├── generate-insights.mjs  # LLM 生成中文解读
│   └── build-data.mjs         # 合并 → assets/data.js
├── .github/workflows/
│   ├── refresh.yml            # 每天 UTC 01:00 自动跑
│   └── deploy.yml             # push 到 main 部署到 Pages
├── package.json
└── README.md
```

## 🚀 本地运行

```bash
npm run fetch      # 抓真实数据 (需要 GH_TOKEN, 可选)
npm run insights   # 生成 LLM 解读 (需要 OPENAI_API_KEY, 可选)
npm run build      # 合并 → assets/data.js
npm run dev        # 启动本地服务器 http://localhost:3001
```

如果只是想预览，跳过 fetch/insights 直接 `python3 -m http.server 3001` 就行。

## ☁️ 部署到 GitHub Pages

1. 把这个目录 `git init` + 推到你自己的 GitHub 仓库
2. 仓库 Settings → Pages → Source 选 "GitHub Actions"
3. push 后 `deploy.yml` 自动把整个目录部署到 Pages
4. 每次 `refresh.yml` 更新数据后, `deploy.yml` 也会自动触发

## 🔐 Secrets (可选, 增强数据质量)

在仓库 Settings → Secrets and variables → Actions 添加：

| Secret | 用途 | 不填时 |
|---|---|---|
| `GITHUB_TOKEN` | 调 GitHub API (5000 req/h) | 用匿名 (60 req/h) |
| `OPENAI_API_KEY` | LLM 写 whyHot / highlights | 保留人工撰写内容 |
| `OPENAI_BASE_URL` | 自定义 OpenAI 兼容端点 | 默认 `api.openai.com` |
| `OPENAI_MODEL` | 模型名 | 默认 `gpt-4o-mini` |

## ✏️ 添加新项目

1. 编辑 `projects/data.json`，加一条：
   ```json
   { "id": "your-repo", "name": "Your Repo", "owner": "owner", "category": "AI 工具", "tags": ["x","y"], "gradient": ["#a","#b"] }
   ```
   只填最少字段，stats 会被 workflow 自动补齐。
2. `node scripts/fetch-stats.mjs` 拉真实数据
3. `node scripts/build-data.mjs` 重新生成 data.js
4. (可选) `node scripts/generate-insights.mjs` 让 LLM 写解读

## 🧰 技术选型理由

- **静态站** → 你的需求是浏览+详情，动态后端没必要
- **GitHub Actions 自动刷新** → 零服务器成本，0.5 GB/月免费额度足够
- **GitHub Pages 部署** → 全球 CDN、自动 HTTPS、与代码同源
- **站在巨人肩膀上** → 数据抓取复用 GitHub REST API，LLM 部分用 OpenAI 兼容协议（可接 DeepSeek/通义/Ollama 任意）
