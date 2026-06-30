#!/usr/bin/env node
/**
 * fetch-stats.mjs
 * ----------------
 * 1. Read the curated project list (projects/data.json) — only the slug/owner/name are needed
 * 2. For each project, call GitHub REST API to get the REAL stargazers_count, forks_count,
 *    language, description, topics, homepage, pushed_at, license
 * 3. Compute a "weekly growth" hint by stargazers_count / (days_since_created + 1)
 * 4. Merge the live stats back into projects/data.json, KEEPING the curated fields
 *    (summary, intro, whyHot, highlights, tags, category, gradient) intact
 *
 * Auth: uses GH_TOKEN env if available (5000 req/h), else unauthenticated (60 req/h).
 *
 * Usage:
 *   GH_TOKEN=xxx node scripts/fetch-stats.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, '..', 'projects', 'data.json');

const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const UA = 'tophub-bot/1.0 (+https://github.com)';
const HEADERS = {
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': UA,
  ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}),
};

const fmt = (n) => {
  if (typeof n !== 'number') return n;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return String(n);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRepo(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} for ${owner}/${repo}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Go: '#00ADD8',
  Rust: '#dea584', Shell: '#89e051', C: '#555555', 'C++': '#f34b7d', Java: '#b07219',
  Kotlin: '#A97BFF', Swift: '#F05138', Ruby: '#701516', PHP: '#4F5D95', HTML: '#e34c26',
  CSS: '#563d7c', Dart: '#00B4AB', Lua: '#000080', Elixir: '#6e4a7e',
};

const CATEGORY_HINTS = [
  { k: ['agent', 'llm', 'ai', 'claude', 'gpt'], cat: 'AI Agent' },
  { k: ['local', 'ollama', 'inference', 'runtime'], cat: '本地 LLM' },
  { k: ['browser', 'playwright'], cat: 'AI Agent' },
  { k: ['image', 'video', 'comfy', 'diffusion', 'sd', 'flux'], cat: 'AI 图像' },
  { k: ['workflow', 'automate', 'n8n', 'zapier'], cat: '开发者工具' },
  { k: ['ui', 'chat', 'webui'], cat: 'AI 工具' },
  { k: ['cli', 'coding', 'programming'], cat: 'AI 编程' },
];

function guessCategory(p) {
  const hay = (p.name + ' ' + (p.description || '') + ' ' + (p.topics || []).join(' ')).toLowerCase();
  for (const rule of CATEGORY_HINTS) if (rule.k.some((k) => hay.includes(k))) return rule.cat;
  return p.category || '开发者工具';
}

async function main() {
  const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  console.log(`[fetch] Refreshing ${data.projects.length} projects (token=${TOKEN ? 'yes' : 'no'})`);

  const out = [];
  for (let i = 0; i < data.projects.length; i++) {
    const p = data.projects[i];
    const repo = p.id === 'open-webui' ? 'open-webui' : p.id; // open-webui 特殊: id 与 repo 同名
    try {
      const r = await fetchRepo(p.owner, repo);
      const daysSinceCreated = Math.max(1, Math.round((Date.now() - new Date(r.created_at).getTime()) / 86_400_000));
      // 用"日均 Star 增量 × 7"作粗略的周增长展示 (实际接入 Star History 会更准)
      const avgPerDay = r.stargazers_count / daysSinceCreated;
      const growthWeekly = Math.round(avgPerDay * 7);
      const lang = r.language || p.language;
      out.push({
        ...p,
        name: p.name || r.name,
        owner: p.owner || r.owner.login,
        repoUrl: p.repoUrl || r.html_url,
        homepage: p.homepage || r.homepage || '',
        language: lang,
        languageColor: LANG_COLORS[lang] || p.languageColor || '#8b8b8b',
        stars: r.stargazers_count,
        forks: r.forks_count,
        growth: growthWeekly >= 1000 ? `+${(growthWeekly / 1000).toFixed(1).replace(/\.0$/, '')}k` : `+${growthWeekly}`,
        tags: p.tags && p.tags.length ? p.tags : (r.topics || []).slice(0, 4),
        category: p.category && p.category !== '开发者工具' ? p.category : guessCategory(r),
        // 让"显示 Star"和原始数都能看到
        starsHuman: fmt(r.stargazers_count),
        forksHuman: fmt(r.forks_count),
        description: r.description || p.summary,
        license: r.license?.spdx_id || '',
        lastPush: r.pushed_at,
      });
      console.log(`  ✓ ${p.owner}/${repo} ★ ${fmt(r.stargazers_count)} (${growthWeekly >= 1000 ? '+' + (growthWeekly/1000).toFixed(1)+'k' : '+'+growthWeekly}/7d)`);
    } catch (e) {
      console.log(`  ✗ ${p.owner}/${repo} → ${e.message}`);
      out.push(p); // 失败时保留旧值
    }
    // 未认证版 60 req/h，加 sleep 保险
    if (!TOKEN && i < data.projects.length - 1) await sleep(1100);
  }

  const next = { ...data, projects: out, lastRefresh: new Date().toISOString() };
  writeFileSync(DATA_PATH, JSON.stringify(next, null, 2) + '\n', 'utf8');
  console.log(`[fetch] done. lastRefresh=${next.lastRefresh}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
