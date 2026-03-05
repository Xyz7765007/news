import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── RSS Parser ───────────────────────────────────────────────────

function parseRSSItems(xml, defaultSource) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const x = match[1];
    const title = tag(x, "title");
    const link = tag(x, "link") || tagAttr(x, "link", "href");
    const pubDate = tag(x, "pubDate") || tag(x, "published");
    const desc = tag(x, "description") || tag(x, "summary");
    const src = tag(x, "source") || srcFromTitle(title) || defaultSource || "News";
    if (title && title.length > 10) {
      items.push({
        headline: clean(title), description: clean(desc || "").slice(0, 300),
        url: clean(link || ""), source: clean(src),
        date: pubDate ? safeDate(pubDate) : new Date().toISOString(),
      });
    }
  }
  return items;
}

function tag(xml, t) {
  const cd = xml.match(new RegExp(`<${t}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${t}>`, "i"));
  if (cd) return cd[1].trim();
  const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, "i"));
  return m ? m[1].trim() : "";
}
function tagAttr(xml, t, a) { const m = xml.match(new RegExp(`<${t}[^>]*${a}="([^"]*)"`, "i")); return m ? m[1] : ""; }
function srcFromTitle(t) { const m = t?.match(/\s[-–—]\s([^-–—]+)$/); return m ? m[1].trim() : ""; }
function clean(t) {
  if (!t) return "";
  return t.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").trim();
}
function safeDate(s) { try { const d = new Date(s); return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(); } catch { return new Date().toISOString(); } }

async function fetchRSS(url, label, defaultSource) {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "application/rss+xml, application/xml, text/xml, */*" },
      signal: ctrl.signal,
    });
    clearTimeout(to);
    if (!res.ok) { console.error(`${label}: HTTP ${res.status}`); return []; }
    const xml = await res.text();
    if (!xml.includes("<item>")) { console.error(`${label}: no items`); return []; }
    const items = parseRSSItems(xml, defaultSource);
    console.log(`${label}: ${items.length} items`);
    return items;
  } catch (e) { console.error(`${label}: ${e.message}`); return []; }
}

// ─── Article Content Fetcher ──────────────────────────────────────

async function fetchArticleContent(url) {
  if (!url || url.length < 10) return "";
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "text/html,*/*" },
      signal: ctrl.signal, redirect: "follow",
    });
    clearTimeout(to);
    if (!res.ok) return "";
    const html = await res.text();
    const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    let text = article ? article[1] : (html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || []).join(" ");
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
    return text.slice(0, 800);
  } catch { return ""; }
}

// ═══════════════════════════════════════════════════════════════════
// MODE: NEWS — Google News RSS → Classify against news tasks
// ═══════════════════════════════════════════════════════════════════

async function scanNews(company, taskDefs) {
  console.log(`  [NEWS] Fetching for ${company.name}...`);

  const q = encodeURIComponent(`"${company.name}"`);
  const newsItems = await fetchRSS(
    `https://news.google.com/rss/search?q=${q}+when:7d&hl=en&gl=US&ceid=US:en`,
    `Google News [${company.name}]`, "Google News"
  );

  if (newsItems.length === 0) {
    console.log(`  [NEWS] No RSS results, using AI generation`);
    return generateAINews(company, taskDefs);
  }

  // Enrich with article content
  const enriched = await Promise.all(
    newsItems.slice(0, 10).map(async (n) => ({
      ...n, signalType: "news",
      articleContent: await fetchArticleContent(n.url),
    }))
  );

  // Classify against news tasks only
  return classifySignals(enriched, taskDefs, company.name, "news");
}

async function generateAINews(company, taskDefs) {
  const taskList = taskDefs.map(t => `ID:"${t.id}" | "${t.name}" | Keywords:[${(t.keywords || []).join(", ")}]`).join("\n");
  try {
    const c = await openai.chat.completions.create({
      model: "gpt-4o-mini", temperature: 0.7, max_tokens: 2000,
      messages: [
        { role: "system", content: `Generate 3-5 realistic NEWS headlines for a company matching these signal task definitions. Each must match at least one task. Return ONLY JSON array: [{"headline":"...","description":"...","source":"Reuters|Bloomberg|TechCrunch|Financial Times","url":"https://realistic-url","date":"ISO within 7 days","matchedTaskIds":["n1"],"confidence":0.85,"signalType":"news"}]` },
        { role: "user", content: `Company: ${company.name} (${company.domain}, ${company.industry || "B2B"})\n\nTasks:\n${taskList}` },
      ],
    });
    const text = c.choices[0]?.message?.content || "[]";
    let r; try { r = JSON.parse(text.replace(/```json\n?|```/g, "").trim()); } catch { const m = text.match(/\[[\s\S]*\]/); r = m ? JSON.parse(m[0]) : []; }
    const valid = new Set(taskDefs.map(t => t.id));
    return (Array.isArray(r) ? r : []).filter(i => i.headline && i.matchedTaskIds?.length)
      .map(i => ({ ...i, signalType: "news", matchedTaskIds: i.matchedTaskIds.filter(id => valid.has(id)), confidence: Math.min(1, Math.max(0, i.confidence || 0.7)) }))
      .filter(i => i.matchedTaskIds.length > 0);
  } catch (e) { console.error("AI news gen error:", e); return []; }
}

// ═══════════════════════════════════════════════════════════════════
// MODE: JOBS — Google News hiring queries + Indeed → Classify against job tasks
// ═══════════════════════════════════════════════════════════════════

async function scanJobs(company, taskDefs) {
  console.log(`  [JOBS] Fetching for ${company.name}...`);

  // Build targeted job queries from task definitions' jobTitleKeywords
  const allJobKeywords = taskDefs.flatMap(t => t.jobTitleKeywords || t.keywords || []);
  const uniqueKeywords = [...new Set(allJobKeywords)].slice(0, 15);

  // Strategy 1: Google News for hiring announcements
  const hiringQueries = [
    `"${company.name}" hires OR appoints OR names ${uniqueKeywords.slice(0, 5).map(k => `"${k}"`).join(" OR ")}`,
    `"${company.name}" hiring OR "open role" OR "job opening" marketing`,
  ];

  // Strategy 2: Indeed RSS for actual job listings
  const indeedQueries = uniqueKeywords.length > 0
    ? [`${uniqueKeywords.slice(0, 6).join(" OR ")} company:${company.name}`]
    : [`CMO OR "VP Marketing" OR "Marketing Director" company:${company.name}`];

  // Fetch all in parallel
  const fetches = [];

  for (const query of hiringQueries) {
    fetches.push(fetchRSS(
      `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+when:30d&hl=en&gl=US&ceid=US:en`,
      `Hiring News [${company.name}]`, "Google News"
    ));
  }

  for (const query of indeedQueries) {
    fetches.push(fetchRSS(
      `https://www.indeed.com/rss?q=${encodeURIComponent(query)}&sort=date&limit=10`,
      `Indeed [${company.name}]`, "Indeed"
    ));
  }

  const results = await Promise.all(fetches);
  const allItems = results.flat();

  // Deduplicate
  const seen = new Set();
  const deduped = allItems.filter(n => {
    const key = n.headline.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(n => ({ ...n, signalType: "job_post" }));

  console.log(`  [JOBS] Found ${deduped.length} job signals`);

  if (deduped.length === 0) {
    console.log(`  [JOBS] No RSS results, using AI generation`);
    return generateAIJobs(company, taskDefs);
  }

  // Enrich with content
  const enriched = await Promise.all(
    deduped.slice(0, 8).map(async (n) => ({
      ...n, articleContent: await fetchArticleContent(n.url),
    }))
  );

  return classifySignals(enriched, taskDefs, company.name, "jobs");
}

async function generateAIJobs(company, taskDefs) {
  const taskList = taskDefs.map(t => `ID:"${t.id}" | "${t.name}" | JobTitles:[${(t.jobTitleKeywords || t.keywords || []).join(", ")}]`).join("\n");
  try {
    const c = await openai.chat.completions.create({
      model: "gpt-4o-mini", temperature: 0.7, max_tokens: 2000,
      messages: [
        { role: "system", content: `Generate 3-5 realistic JOB POSTING signals for a company matching these job task definitions. Each must match at least one task. Return ONLY JSON array: [{"headline":"Job Title - Company Name","description":"Job description excerpt with responsibilities and requirements","source":"LinkedIn|Indeed|Company Careers","url":"https://realistic-job-url","date":"ISO within 14 days","matchedTaskIds":["j1"],"confidence":0.85,"signalType":"job_post"}]` },
        { role: "user", content: `Company: ${company.name} (${company.domain}, ${company.industry || "B2B"}, ${company.size || "Unknown"} employees)\n\nJob Tasks:\n${taskList}` },
      ],
    });
    const text = c.choices[0]?.message?.content || "[]";
    let r; try { r = JSON.parse(text.replace(/```json\n?|```/g, "").trim()); } catch { const m = text.match(/\[[\s\S]*\]/); r = m ? JSON.parse(m[0]) : []; }
    const valid = new Set(taskDefs.map(t => t.id));
    return (Array.isArray(r) ? r : []).filter(i => i.headline && i.matchedTaskIds?.length)
      .map(i => ({ ...i, signalType: "job_post", matchedTaskIds: i.matchedTaskIds.filter(id => valid.has(id)), confidence: Math.min(1, Math.max(0, i.confidence || 0.7)) }))
      .filter(i => i.matchedTaskIds.length > 0);
  } catch (e) { console.error("AI jobs gen error:", e); return []; }
}

// ─── Shared Classification ────────────────────────────────────────

async function classifySignals(signals, taskDefs, companyName, mode) {
  if (!signals.length || !taskDefs.length) return [];

  const taskList = taskDefs
    .map(t => `ID:"${t.id}" | Name:"${t.name}" | Description:"${t.description}" | Keywords:[${(t.keywords || []).join(", ")}]${t.jobTitleKeywords ? ` | JobTitles:[${t.jobTitleKeywords.join(", ")}]` : ""}`)
    .join("\n");

  const signalList = signals
    .map((n, i) => {
      let entry = `[${i}] "${n.headline}"`;
      if (n.description) entry += `\n    Summary: ${n.description.slice(0, 200)}`;
      if (n.articleContent?.length > 50) entry += `\n    Content: ${n.articleContent.slice(0, 500)}`;
      return entry;
    }).join("\n\n");

  const systemPrompt = mode === "jobs"
    ? `You classify job postings and hiring news against job task definitions. Match based on job title keywords, role descriptions, and seniority level. Be generous — partial title matches count. Return ONLY JSON array: [{"newsIndex":0,"matchedTaskIds":["j1"],"confidence":0.85}]. Omit non-matches.`
    : `You classify news articles against signal task definitions. Use headlines, summaries, AND article content for accurate matching. Be generous — semantic matches count. Return ONLY JSON array: [{"newsIndex":0,"matchedTaskIds":["n1"],"confidence":0.85}]. Omit non-matches.`;

  try {
    const c = await openai.chat.completions.create({
      model: "gpt-4o-mini", temperature: 0.15, max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Company: ${companyName}\n\nSignals:\n${signalList}\n\nTasks:\n${taskList}` },
      ],
    });
    const text = c.choices[0]?.message?.content || "[]";
    let cls; try { cls = JSON.parse(text.replace(/```json\n?|```/g, "").trim()); } catch { const m = text.match(/\[[\s\S]*\]/); cls = m ? JSON.parse(m[0]) : []; }
    if (!Array.isArray(cls)) return [];
    const valid = new Set(taskDefs.map(t => t.id));
    return signals.map((sig, i) => {
      const c = cls.find(x => x.newsIndex === i);
      if (!c) return { ...sig, matchedTaskIds: [], confidence: 0 };
      return { ...sig, matchedTaskIds: (c.matchedTaskIds || []).filter(id => valid.has(id)), confidence: Math.min(1, Math.max(0, c.confidence || 0.7)) };
    });
  } catch (e) {
    console.error(`Classification error (${mode}):`, e);
    // Keyword fallback
    return signals.map(sig => {
      const text = (sig.headline + " " + (sig.description || "")).toLowerCase();
      const matched = taskDefs.filter(t => (t.keywords || []).some(kw => text.includes(kw.toLowerCase())));
      return { ...sig, matchedTaskIds: matched.map(t => t.id), confidence: matched.length > 0 ? 0.6 : 0 };
    });
  }
}

// ─── Main Route ───────────────────────────────────────────────────

export async function POST(request) {
  try {
    const { company, taskDefs, mode } = await request.json();

    if (!company?.name) return NextResponse.json({ error: "Company name required" }, { status: 400 });
    if (!taskDefs?.length) return NextResponse.json({ error: "Task definitions required" }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });

    console.log(`\n── Scanning: ${company.name} [${mode}] ──`);

    let signals;
    if (mode === "jobs") {
      signals = await scanJobs(company, taskDefs);
    } else {
      signals = await scanNews(company, taskDefs);
    }

    return NextResponse.json({
      news: signals,
      company: company.name,
      mode,
      matchedCount: signals.filter(n => (n.matchedTaskIds || []).length > 0).length,
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
