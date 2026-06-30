/* ============================================================
 * TopHub · premium front-end logic (v2 — mobile-first redesign)
 * ============================================================ */
(() => {
  'use strict';
  const $app = document.getElementById('app');
  const data = (window.TOPHUB_DATA && window.TOPHUB_DATA.projects) || [];
  const state = { filter: 'All' };

  const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n));
  const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = (s) => s.slice(0, 2).toUpperCase();
  const uniq = (arr) => Array.from(new Set(arr));
  const coverUrl = (p) => 'https://opengraph.githubassets.com/1/' + p.owner + '/' + (p.id === 'open-webui' ? 'open-webui' : (p.owner + '/' + p.id));
  const avatarUrl = (p, size = 80) => 'https://github.com/' + p.owner + '.png?size=' + size;

  /* -------- theme -------- */
  const THEME_KEY = 'tophub-theme';
  const applyTheme = (t) => {
    const r = document.documentElement; r.classList.remove('dark', 'light'); r.classList.add(t); r.style.colorScheme = t;
    const m = document.querySelector('meta[name="theme-color"]') || Object.assign(document.createElement('meta'), { name: 'theme-color' });
    m.content = t === 'light' ? '#f7f8fa' : '#08090d';
    if (!m.parentNode) document.head.appendChild(m);
  };
  const initTheme = () => applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
  const cycleTheme = () => {
    const cur = localStorage.getItem(THEME_KEY) || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next); render();
  };

  /* -------- icons -------- */
  const I = {
    star: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    fork: '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0zM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0z"/></svg>',
    arrow: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>',
    arrowR: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    theme: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    gh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.05.78 2.12v3.14c0 .31.21.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    trend: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
    flame: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>',
  };
  /* -------- shell -------- */
  const Nav = () => `
    <header class="nav-glass sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        <a href="#/" class="flex items-center gap-2.5 group shrink-0">
          <span class="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-accent-400 via-fuchsia-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-accent-500/30 group-hover:shadow-accent-500/50 transition-shadow">
            <span class="absolute inset-0 rounded-xl bg-white/10"></span>
            <span class="relative font-mono font-bold text-ink-950 text-[15px]">T</span>
          </span>
          <span class="flex flex-col leading-none">
            <span class="text-[14px] sm:text-[15px] font-bold tracking-tight">TopHub</span>
            <span class="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-ink-400 mt-0.5">github · trending</span>
          </span>
        </a>
        <nav class="desktop-nav items-center gap-7 text-sm text-ink-300">
          <a href="#/" class="hover:text-white transition-colors">首页</a>
          <a href="#projects" class="hover:text-white transition-colors">热门项目</a>
          <a href="#about" class="hover:text-white transition-colors">关于</a>
        </nav>
        <div class="flex items-center gap-1.5 sm:gap-2">
          <a href="https://github.com/trending" target="_blank" rel="noopener" class="hidden sm:inline-flex items-center gap-1.5 text-xs text-ink-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/15 transition-all">${I.gh}<span>Trending</span></a>
          <button id="themeBtn" title="切换主题" aria-label="切换主题" class="magnetic w-9 h-9 grid place-items-center rounded-lg border border-white/5 hover:border-white/15 text-ink-200 hover:text-white transition-colors">${I.theme}</button>
        </div>
      </div>
    </header>`;

  const Footer = () => `
    <footer class="border-t border-white/5 mt-20 sm:mt-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-ink-400">
        <div class="flex flex-wrap items-center justify-center gap-2 text-center md:text-left">
          <span class="font-mono font-semibold text-ink-200">TopHub</span>
          <span>·</span>
          <span>精选 GitHub 热门开源项目，深度解读为什么火</span>
        </div>
        <div class="flex items-center gap-4 sm:gap-5">
          <a class="hover:text-white transition-colors" href="https://github.com/trending" target="_blank" rel="noopener">GitHub Trending</a>
          <a class="hover:text-white transition-colors" href="https://trendshift.io" target="_blank" rel="noopener">TrendShift</a>
          <a class="hover:text-white transition-colors" href="https://risingstars.js.org" target="_blank" rel="noopener">Rising Stars</a>
        </div>
      </div>
    </footer>`;

  /* -------- hero -------- */
  const Hero = () => `
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 bg-aurora opacity-95"></div>
      <div class="absolute inset-0 bg-grid opacity-30"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36">
        <div class="flex items-center gap-2 mb-5 sm:mb-7 reveal">
          <span class="relative inline-flex w-2.5 h-2.5">
            <span class="pulse-dot absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </span>
          <span class="text-[10px] sm:text-xs font-mono text-emerald-400 tracking-widest uppercase">Live · 2026-06-30</span>
        </div>
        <h1 class="display text-[44px] leading-[0.95] sm:text-7xl lg:text-[88px] tracking-tight max-w-5xl reveal">
          GitHub 上 <em class="em text-shimmer">真正</em><br class="hidden sm:block"/>
          值得追的<br class="sm:hidden"/>
          <span class="text-shimmer">开源项目</span>
        </h1>
        <p class="mt-6 sm:mt-8 text-[15px] sm:text-lg text-ink-300 max-w-2xl leading-relaxed reveal">
          TopHub 每天精选 GitHub 最火的项目，告诉你它<strong class="text-white font-semibold">解决了什么问题、为什么突然火、怎么用起来</strong>。不是又一个 Trending 榜单，是<strong class="text-white font-semibold">真正能读完的解读</strong>。
        </p>
        <div class="mt-8 sm:mt-10 flex flex-wrap items-center gap-3 reveal">
          <a href="#projects" class="magnetic group inline-flex items-center gap-2 bg-white text-ink-950 font-semibold text-[14px] sm:text-sm px-5 py-3 sm:py-3.5 rounded-xl hover:bg-ink-100 transition-colors">
            <span>浏览 ${data.length} 个精选项目</span>
            <span class="transition-transform group-hover:translate-x-1">→</span>
          </a>
          <a href="#about" class="magnetic inline-flex items-center gap-2 text-[14px] sm:text-sm px-5 py-3 sm:py-3.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
            <span>TopHub 是怎么挑项目的</span>
          </a>
        </div>
        <div class="mt-12 sm:mt-16 flex flex-wrap items-center gap-x-8 sm:gap-x-12 gap-y-4 text-sm text-ink-400 reveal">
          <div class="flex items-baseline gap-1.5"><span class="text-white font-bold text-2xl sm:text-3xl">${data.length}+</span><span>精选项目</span></div>
          <div class="flex items-baseline gap-1.5"><span class="text-white font-bold text-2xl sm:text-3xl">${uniq(data.map((p) => p.category)).length}</span><span>话题领域</span></div>
          <div class="flex items-baseline gap-1.5"><span class="text-white font-bold text-2xl sm:text-3xl">${uniq(data.map((p) => p.language)).length}</span><span>编程语言</span></div>
        </div>
      </div>
    </section>`;

  const categories = () => ['All', ...uniq(data.map((p) => p.category))];

  const FilterBar = () => {
    const cats = categories();
    return `
      <div class="relative -mx-4 sm:-mx-6 lg:mx-0 mb-8 sm:mb-10">
        <div class="overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-0">
          <div class="flex items-center gap-2 sm:gap-2.5 min-w-max" id="filterBar">
            ${cats.map((c) => {
              const active = state.filter === c;
              const n = c === 'All' ? data.length : data.filter((p) => p.category === c).length;
              return `<button data-cat="${c}" class="cat-btn tab-pill chip px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border whitespace-nowrap ${active ? 'bg-white text-ink-950 border-white font-semibold shadow-lg shadow-white/10' : 'border-white/10 text-ink-300 hover:border-white/25 hover:text-white'}">${c} <span class="ml-1.5 ${active ? 'text-ink-500' : 'text-ink-500'}">${n}</span></button>`;
            }).join('')}
          </div>
        </div>
      </div>`;
  };

  /* -------- hero (big) project card -------- */
  const HeroCard = (p) => {
    const [gradA, gradB] = p.gradient;
    return `
      <a href="#/p/${p.id}" class="project-card magnetic group relative block rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
        <div class="absolute -top-24 -right-24 w-72 sm:w-96 h-72 sm:h-96 rounded-full opacity-30 group-hover:opacity-50 transition-opacity blur-3xl pointer-events-none" style="background: radial-gradient(circle, ${gradA} 0%, transparent 70%);"></div>
        <div class="absolute -bottom-24 -left-24 w-72 sm:w-96 h-72 sm:h-96 rounded-full opacity-20 group-hover:opacity-35 transition-opacity blur-3xl pointer-events-none" style="background: radial-gradient(circle, ${gradB} 0%, transparent 70%);"></div>
        <div class="relative grid grid-cols-1 lg:grid-cols-5">
          <div class="relative lg:col-span-3 h-56 sm:h-72 lg:h-[360px] cover-art" style="background: linear-gradient(135deg, ${gradA} 0%, ${gradB} 100%);">
            <img src="${coverUrl(p)}" alt="" loading="eager" referrerpolicy="no-referrer" onerror="this.style.display='none'" class="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
            <div class="absolute top-3 left-3 sm:top-5 sm:left-5 inline-flex items-center gap-1.5 chip px-2.5 py-1 rounded-md bg-black/55 text-white border border-white/15 backdrop-blur-md">${I.flame}<span>本周头条</span></div>
            <div class="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 flex items-center gap-2.5">
              <img src="${avatarUrl(p, 80)}" alt="${p.owner}" referrerpolicy="no-referrer" loading="lazy"
                   onerror="this.outerHTML='<div class=&quot;w-9 h-9 sm:w-10 sm:h-10 rounded-lg grid place-items-center font-bold text-ink-950 text-sm&quot; style=&quot;background:linear-gradient(135deg,${gradA},${gradB})&quot;>${initials(p.name)}</div>'"
                   class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg ring-1 ring-white/20" />
              <div>
                <p class="font-mono text-[11px] text-white/85">${escape(p.owner)}</p>
                <p class="font-mono text-[10px] text-white/55">${escape(p.language)}</p>
              </div>
            </div>
          </div>
          <div class="lg:col-span-2 p-5 sm:p-7 flex flex-col justify-between gap-5 sm:gap-6">
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="chip px-2 py-0.5 rounded-md bg-white/5 text-ink-300 border border-white/5">${escape(p.category)}</span>
                <span class="chip inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">${I.trend}<span class="font-semibold">${p.growth}</span><span class="text-emerald-500/60">/7d</span></span>
              </div>
              <h3 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white group-hover:text-accent-300 transition-colors">${escape(p.name)}</h3>
              <p class="text-sm sm:text-[15px] text-ink-200 mt-3 leading-relaxed">${escape(p.summary)}</p>
            </div>
            <div class="flex items-center justify-between pt-4 border-t border-white/5">
              <div class="flex items-center gap-4 text-sm text-ink-300">
                <span class="inline-flex items-center gap-1.5">${I.star}<span class="text-ink-100 font-semibold">${fmt(p.stars)}</span></span>
                <span class="inline-flex items-center gap-1.5">${I.fork}<span>${fmt(p.forks)}</span></span>
              </div>
              <span class="inline-flex items-center gap-1.5 text-sm text-accent-300 group-hover:gap-2.5 transition-all font-semibold">查看解读 ${I.arrowR}</span>
            </div>
          </div>
        </div>
      </a>`;
  };

  /* -------- standard project card -------- */
  const ProjectCard = (p) => {
    const [gradA, gradB] = p.gradient;
    return `
      <a href="#/p/${p.id}" data-id="${p.id}" class="project-card magnetic group relative block rounded-2xl card-surface overflow-hidden hover:border-white/15 transition-all">
        <div class="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-20 group-hover:opacity-30 transition-opacity blur-3xl pointer-events-none" style="background: radial-gradient(circle, ${gradA} 0%, transparent 70%);"></div>
        <div class="relative h-36 sm:h-40 cover-art" style="background: linear-gradient(135deg, ${gradA} 0%, ${gradB} 100%);">
          <img src="${coverUrl(p)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'" class="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
          <div class="absolute top-2.5 right-2.5">
            <span class="chip inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-emerald-950 font-semibold border border-emerald-300/40 shadow-md shadow-emerald-500/30">${p.growth}</span>
          </div>
          <div class="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 chip px-2 py-0.5 rounded-md bg-black/45 text-white border border-white/15 backdrop-blur-md">
            <span class="w-1.5 h-1.5 rounded-full" style="background:${p.languageColor}"></span>${p.language}
          </div>
        </div>
        <div class="relative p-4 sm:p-5">
          <div class="flex items-center gap-2.5 mb-2.5">
            <img src="${avatarUrl(p, 64)}" alt="${p.owner}" loading="lazy" referrerpolicy="no-referrer"
                 onerror="this.outerHTML='<div class=&quot;w-8 h-8 rounded-md grid place-items-center font-bold text-ink-950 text-xs&quot; style=&quot;background:linear-gradient(135deg,${gradA},${gradB})&quot;>${initials(p.name)}</div>'"
                 class="w-8 h-8 rounded-md ring-1 ring-white/10" />
            <div class="min-w-0 flex-1">
              <h3 class="text-[15px] font-bold text-white group-hover:text-accent-300 transition-colors truncate">${escape(p.name)}</h3>
              <p class="font-mono text-[11px] text-ink-400 truncate">${escape(p.owner)}</p>
            </div>
          </div>
          <p class="text-sm text-ink-300 leading-relaxed mb-3 line-clamp-2 min-h-[2.6em]">${escape(p.summary)}</p>
          <div class="flex flex-wrap gap-1 mb-3">
            ${p.tags.slice(0, 2).map((t) => `<span class="chip px-1.5 py-0.5 rounded-md bg-white/5 text-ink-300 border border-white/5">${escape(t)}</span>`).join('')}
            ${p.tags.length > 2 ? `<span class="chip px-1.5 py-0.5 rounded-md bg-white/5 text-ink-500 border border-white/5">+${p.tags.length - 2}</span>` : ''}
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-white/5">
            <div class="flex items-center gap-3 text-xs text-ink-400">
              <span class="inline-flex items-center gap-1">${I.star}<span class="text-ink-200 font-semibold">${fmt(p.stars)}</span></span>
              <span class="inline-flex items-center gap-1">${I.fork}<span>${fmt(p.forks)}</span></span>
            </div>
            <span class="inline-flex items-center gap-1 text-xs text-accent-300 group-hover:gap-1.5 transition-all font-semibold">${I.arrowR}</span>
          </div>
        </div>
      </a>`;
  };

  const Section = (id, title, subtitle, bodyHtml) => `
    <section id="${id}" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
      <div class="flex items-end justify-between mb-8 sm:mb-10 reveal">
        <div>
          <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">${title}</h2>
          <p class="text-ink-400 text-sm sm:text-base mt-2">${subtitle}</p>
        </div>
      </div>
      ${bodyHtml}
    </section>`;

  const Grid = (items) => `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
      ${items.map((p) => ProjectCard(p)).join('')}
    </div>`;

  const About = () => Section('about', 'TopHub 是怎么挑项目的', '我们不复制 Trending 榜单，而是从"为什么火"的角度做二次筛选', `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 reveal">
      ${[
        { icon: '⚡', t: '看趋势，不看绝对值', d: '一个项目从 1k Star 涨到 5k 比从 100k 涨到 102k 更有价值，我们更关注增长率与社区话题度。' },
        { icon: '🧠', t: '看问题，不看参数', d: '不是为了追求大而全的参数表，而是真正回答：这个项目解决了什么痛点？为什么开发者愿意用？' },
        { icon: '🇨🇳', t: '看落地，不看翻译', d: '不是把 README 翻译一遍，而是写"在中国开发者手里能怎么用、有什么坑、值不值得上生产"。' },
      ].map((c) => `<div class="feature-card rounded-2xl p-6 sm:p-7 transition-all"><div class="text-2xl mb-4">${c.icon}</div><h3 class="text-base sm:text-lg font-bold text-white mb-2">${c.t}</h3><p class="text-sm text-ink-300 leading-relaxed">${c.d}</p></div>`).join('')}
    </div>
    <div class="mt-6 sm:mt-8 card-surface rounded-2xl p-6 sm:p-8 reveal">
      <h3 class="text-base sm:text-lg font-bold text-white mb-3">技术选型：站在巨人的肩膀上</h3>
      <p class="text-sm text-ink-300 leading-relaxed mb-4">数据采集可以复用 <a class="text-accent-300 hover:underline" href="https://github.com/aneasystone/github-trending" target="_blank" rel="noopener">aneasystone/github-trending</a> 的 GitHub Actions 爬虫思路，差异化在于我们用 LLM 辅助生成中文解读，再人工校对。</p>
      <pre class="code-block"><code><span class="text-ink-500"># 一键抓取 GitHub Trending</span>
<span class="text-fuchsia-400">$</span> curl https://api.github.com/search/repositories?q=stars:&gt;1000&amp;sort=stars
<span class="text-ink-500"># 配 Actions 每天跑，零成本</span>
<span class="text-emerald-400">✓</span> Crontab: <span class="text-accent-300">"0 9 * * *"</span>  <span class="text-ink-500"># UTC 9:00 抓取</span></code></pre>
    </div>`);
  /* -------- detail page (5-section deep-dive) -------- */
  const Detail = (p) => {
    const [gradA, gradB] = p.gradient;
    const sections = [
      { id: 'sec-intro',     title: '项目介绍',   body: (p.intro || '').split('\n\n').map(parToHtml).join('') },
      { id: 'sec-bg',        title: '背景故事',   body: (p.background || '').split('\n\n').map(parToHtml).join('') },
      { id: 'sec-how',       title: '怎么工作',   body: (p.howItWorks || '').split('\n\n').map(parToHtml).join('') },
      { id: 'sec-why',       title: '为什么火',   body: (p.whyHot || []).map((w, i) => `
        <div class="card-surface rounded-xl p-4 sm:p-5 flex gap-3 sm:gap-4 mb-3">
          <span class="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-accent-500 to-fuchsia-500 text-ink-950 font-bold text-sm grid place-items-center">${i + 1}</span>
          <p class="text-[14px] sm:text-[15px] text-ink-200 leading-relaxed">${escape(w)}</p>
        </div>`).join('') },
      { id: 'sec-high',      title: '核心亮点',   body: `<ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">${(p.highlights || []).map((h) => `
        <li class="card-surface rounded-xl p-4 flex items-start gap-3 text-[14px] sm:text-sm text-ink-200">
          <span class="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0"></span><span>${escape(h)}</span>
        </li>`).join('')}</ul>` },
      { id: 'sec-use',       title: '适用场景',   body: `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">${(p.useCases || []).map((u) => `
        <div class="card-surface rounded-xl p-4 sm:p-5 flex items-start gap-3">
          <span class="text-accent-300 text-lg leading-none mt-0.5">▸</span>
          <p class="text-[14px] sm:text-[15px] text-ink-200 leading-relaxed">${escape(u)}</p>
        </div>`).join('')}</div>` },
    ];
    return `
      <article class="relative">
        <div class="absolute inset-x-0 top-0 h-[480px] overflow-hidden -z-10">
          <div class="absolute inset-0" style="background: radial-gradient(60% 60% at 50% 0%, ${gradA}55 0%, transparent 60%), radial-gradient(50% 50% at 80% 20%, ${gradB}55 0%, transparent 60%);"></div>
          <div class="absolute inset-0 bg-grid opacity-30"></div>
        </div>
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-16 sm:pb-24">
          <a href="#/" class="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white mb-6 sm:mb-8 transition-colors">${I.back} 返回首页</a>
          <div class="relative h-44 sm:h-72 rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-8 ring-1 ring-white/10" style="background: linear-gradient(135deg, ${gradA} 0%, ${gradB} 100%);">
            <img src="${coverUrl(p)}" alt="" referrerpolicy="no-referrer" loading="eager" onerror="this.style.display='none'" class="absolute inset-0 w-full h-full object-cover" />
            <div class="absolute inset-0" style="background: linear-gradient(180deg, transparent 40%, rgba(8,9,13,0.6) 100%);"></div>
          </div>
          <header class="reveal">
            <div class="flex items-center gap-3 mb-4">
              <img src="${avatarUrl(p, 120)}" alt="${p.owner}" referrerpolicy="no-referrer" loading="lazy"
                   onerror="this.outerHTML='<div class=&quot;w-12 h-12 sm:w-14 sm:h-14 rounded-xl grid place-items-center font-bold text-ink-950 text-lg sm:text-xl&quot; style=&quot;background:linear-gradient(135deg,${gradA},${gradB})&quot;>${initials(p.name)}</div>'"
                   class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl ring-1 ring-white/10 shadow-lg" />
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5 mb-1">
                  <span class="chip px-2 py-0.5 rounded-md bg-white/5 text-ink-300 border border-white/5">${escape(p.category)}</span>
                  <span class="inline-flex items-center gap-1.5 text-[11px] font-mono text-ink-400"><span class="w-2 h-2 rounded-full" style="background:${p.languageColor}"></span>${escape(p.language)}</span>
                </div>
                <p class="font-mono text-xs text-ink-400 truncate">${escape(p.owner)} / <span class="text-accent-300">${escape(p.name.toLowerCase())}</span></p>
              </div>
            </div>
            <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight">${escape(p.name)}</h1>
            <p class="text-lg sm:text-xl text-ink-200 mt-4 leading-relaxed">${escape(p.summary)}</p>
            <div class="mt-6 sm:mt-7 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <a href="${p.repoUrl}" target="_blank" rel="noopener" class="magnetic group inline-flex items-center gap-2 bg-white text-ink-950 font-semibold text-sm px-5 py-3 rounded-xl hover:bg-ink-100 transition-colors">
                ${I.gh}<span>在 GitHub 查看</span>
                <span class="transition-transform group-hover:translate-x-0.5">${I.arrow}</span>
              </a>
              ${p.homepage ? `<a href="${p.homepage}" target="_blank" rel="noopener" class="magnetic inline-flex items-center gap-2 text-sm px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">访问官网 ${I.arrow}</a>` : ''}
              <div class="flex items-center gap-4 text-xs text-ink-400 ml-auto">
                <span class="inline-flex items-center gap-1.5">${I.star}<span class="text-ink-200 font-semibold text-sm">${fmt(p.stars)}</span><span class="hidden sm:inline">stars</span></span>
                <span class="inline-flex items-center gap-1.5">${I.fork}<span>${fmt(p.forks)}</span><span class="hidden sm:inline">forks</span></span>
              </div>
            </div>
          </header>
          <div class="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-12">
            <aside class="hidden lg:block">
              <div class="sticky top-24">
                <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-500 mb-3">本文目录</p>
                <nav class="space-y-1 text-sm">
                  ${sections.map((s, i) => `<a href="#${s.id}" class="block px-3 py-2 rounded-lg text-ink-400 hover:text-white hover:bg-white/5 transition-colors">${String(i + 1).padStart(2, '0')} · ${s.title}</a>`).join('')}
                </nav>
                <div class="mt-8 p-4 card-surface rounded-xl">
                  <p class="text-xs text-ink-400 leading-relaxed">${sections.length} 个章节 · 约 ${readingTime(p)} 分钟阅读</p>
                </div>
              </div>
            </aside>
            <div class="min-w-0">
              ${sections.map((s) => `
                <section id="${s.id}" class="mb-12 sm:mb-16 scroll-mt-24 reveal">
                  <div class="flex items-baseline gap-3 mb-5">
                    <span class="font-mono text-[11px] text-ink-500 tracking-widest">SECTION</span>
                    <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight">${s.title}</h2>
                  </div>
                  <div class="text-[15px] sm:text-base text-ink-200 leading-[1.85]">${s.body}</div>
                </section>
              `).join('')}
              <section class="mt-4 card-surface rounded-2xl p-6 sm:p-7 reveal">
                <p class="text-sm text-ink-300 leading-relaxed">
                  <strong class="text-white">注意：</strong>Star 数与项目状态可能随时间变化，最新数据请直接访问
                  <a href="${p.repoUrl}" target="_blank" rel="noopener" class="text-accent-300 hover:underline">GitHub 仓库</a>。
                  解读为 TopHub 团队基于公开信息整理，欢迎在评论区反馈使用心得。
                </p>
              </section>
            </div>
          </div>
        </div>
      </article>`;
  };

  function parToHtml(p) {
    const t = p.trim();
    if (!t) return '';
    // 「数字.」开头的视为加粗小标题
    if (/^\d+\.\s+\*\*/.test(t)) {
      const m = t.match(/^\d+\.\s+\*\*(.+?)\*\*\s*([\s\S]*)/);
      if (m) return `<p class="mb-4"><strong class="text-white font-semibold">${escape(m[1])}</strong>${escape(m[2])}</p>`;
    }
    // **xxx** 内联加粗
    return `<p class="mb-4">${escape(t).replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')}</p>`;
  }

  function readingTime(p) {
    const total = [p.intro, p.background, p.howItWorks, (p.whyHot || []).join(' '), (p.highlights || []).join(' '), (p.useCases || []).join(' ')].join(' ');
    const chars = total.replace(/\s/g, '').length;
    return Math.max(2, Math.round(chars / 350));
  }

  /* -------- router -------- */
  const visibleProjects = () => (state.filter === 'All' ? data : data.filter((p) => p.category === state.filter));

  const route = () => {
    const h = location.hash || '#/';
    const m = h.match(/^#\/p\/([\w-]+)$/);
    if (m) {
      const p = data.find((x) => x.id === m[1]);
      if (p) return Detail(p);
    }
    const list = visibleProjects();
    const heroProject = list[0] ? HeroCard(list[0]) : '';
    const rest = list.slice(1);
    return `
      ${Hero()}
      ${Section('projects', '🔥 本周热门精选', '按分类筛选 · 点击卡片查看完整解读',
        FilterBar() + (heroProject ? heroProject : '') + (rest.length ? Grid(rest) : ''))}
      ${About()}
    `;
  };

  const render = () => {
    initTheme();
    $app.innerHTML = Nav() + '<main>' + route() + '</main>' + Footer();
    wire();
    requestAnimationFrame(() => {
      document.querySelectorAll('.reveal').forEach((el, i) => setTimeout(() => el.classList.add('in'), 40 * i));
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    });
  };

  /* -------- wire -------- */
  const wire = () => {
    const t = document.getElementById('themeBtn');
    if (t) t.addEventListener('click', cycleTheme);
    document.querySelectorAll('.cat-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        state.filter = btn.dataset.cat;
        render();
      });
    });
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.18;
        el.style.transform = 'translate(' + x + 'px, ' + y + 'px) translateY(-2px)';
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  };

  /* -------- boot -------- */
  window.addEventListener('hashchange', render);
  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
})();
