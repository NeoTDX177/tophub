#!/usr/bin/env node
/**
 * generate-insights.mjs
 * ----------------------
 * 读取 projects/data.json，用 LLM (OpenAI 兼容协议) 为每个项目生成/更新
 *  - summary (一句话定位)
 *  - intro   (项目介绍, 80~140 字)
 *  - whyHot  (为什么突然火, 3 条)
 *  - highlights (核心亮点, 4 条)
 *
 * 已存在的人工撰写内容不会被覆盖，除非文件 content/<id>.json 不存在。
 * 支持任意 OpenAI 兼容服务 (OpenAI / DeepSeek / 通义千问 / Ollama / vLLM 等)。
 *
 * Env:
 *   OPENAI_API_KEY   必填 (没填则脚本直接退出，不改任何文件)
 *   OPENAI_BASE_URL  默认 https://api.openai.com/v1
 *   OPENAI_MODEL     默认 gpt-4o-mini
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_PATH = resolve(ROOT, 'projects', 'data.json');
const CONTENT_DIR = resolve(ROOT, 'content');

const API_KEY = process.env.OPENAI_API_KEY || '';
const BASE = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!API_KEY) {
  console.log('[insights] OPENAI_API_KEY not set, skip.');
  process.exit(0);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SYSTEM = `你是 TopHub 站点的资深开源分析师, 专精 AI/开发者工具赛道。
你写中文文案, 风格: 简洁、有判断、有例子、不堆参数。
输出必须是合法 JSON, 不要任何解释或 Markdown 代码块。`;

function userPrompt(p) {
  return `项目: ${p.owner}/${p.id}
GitHub 描述: ${p.description || p.summary || '(无)'}
主语言: ${p.language}  |  Star: ${p.starsHuman || p.stars}  |  Fork: ${p.forksHuman || p.forks}
主页: ${p.homepage || p.repoUrl}

请基于这些事实, 输出严格 JSON (字段顺序无所谓):
{
  "summary": "一句话定位, 18~26 字, 用「是什么/给谁/解决什么」句式",
  "intro": "80~140 字的详细介绍, 包含核心能力 + 与同类差异点",
  "whyHot": ["为什么火 1 (一句话)", "为什么火 2", "为什么火 3"],
  "highlights": ["核心亮点 1", "亮点 2", "亮点 3", "亮点 4"],
  "category": "从 [AI Agent, AI 工具, AI 编程, 本地 LLM, AI 图像, 开发者工具] 里选一个最贴的"
}`;
}

async function ask(p) {
  const res = await fetch(`${BASE.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userPrompt(p) },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LLM ${res.status}: ${t.slice(0, 300)}`);
  }
  const j = await res.json();
  return JSON.parse(j.choices[0].message.content);
}

async function main() {
  const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  console.log(`[insights] generating for ${data.projects.length} projects (model=${MODEL})`);

  for (let i = 0; i < data.projects.length; i++) {
    const p = data.projects[i];
    const outPath = resolve(CONTENT_DIR, `${p.id}.json`);
    if (existsSync(outPath)) {
      console.log(`  · ${p.id}: cached, skip`);
      continue;
    }
    try {
      const insight = await ask(p);
      writeFileSync(outPath, JSON.stringify({ id: p.id, ...insight, generatedAt: new Date().toISOString() }, null, 2) + '\n');
      console.log(`  ✓ ${p.id}: ${insight.summary}`);
    } catch (e) {
      console.log(`  ✗ ${p.id}: ${e.message}`);
    }
    // 简易限速
    await sleep(800);
  }
  console.log('[insights] done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
