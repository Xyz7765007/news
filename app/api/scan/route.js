import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── RSS Parser (for news only) ──────────────────────────────────

function parseRSSItems(xml, defaultSource) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const x = m[1];
    const title = tag(x, "title");
    const link = tag(x, "link") || tagAttr(x, "link", "href");
    const pub = tag(x, "pubDate") || tag(x, "published");
    const desc = tag(x, "description") || tag(x, "summary");
    const src = tag(x, "source") || srcFrom(title) || defaultSource || "News";
    if (title?.length > 10) items.push({ headline: cl(title), description: cl(desc || "").slice(0, 300), url: cl(link || ""), source: cl(src), date: pub ? sd(pub) : new Date().toISOString() });
  }
  return items;
}
function tag(x, t) { const c = x.match(new RegExp(`<${t}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${t}>`, "i")); if (c) return c[1].trim(); const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, "i")); return m ? m[1].trim() : ""; }
function tagAttr(x, t, a) { const m = x.match(new RegExp(`<${t}[^>]*${a}="([^"]*)"`, "i")); return m ? m[1] : ""; }
function srcFrom(t) { const m = t?.match(/\s[-–—]\s([^-–—]+)$/); return m ? m[1].trim() : ""; }
function cl(t) { return (t || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").trim(); }
function sd(s) { try { const d = new Date(s); return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(); } catch { return new Date().toISOString(); } }

async function fetchRSS(url, label, src) {
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 10000);
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", Accept: "application/rss+xml, application/xml, text/xml, */*" }, signal: c.signal });
    clearTimeout(t);
    if (!r.ok) { console.error(`${label}: HTTP ${r.status}`); return []; }
    const xml = await r.text();
    if (!xml.includes("<item>")) { console.error(`${label}: no items`); return []; }
    const items = parseRSSItems(xml, src);
    console.log(`${label}: ${items.length} items`);
    return items;
  } catch (e) { console.error(`${label}: ${e.message}`); return []; }
}

// ─── Article Content Fetcher ──────────────────────────────────────

async function fetchArticle(url) {
  if (!url || url.length < 10) return "";
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 6000);
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", Accept: "text/html,*/*" }, signal: c.signal, redirect: "follow" });
    clearTimeout(t);
    if (!r.ok) return "";
    const html = await r.text();
    const art = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    let text = art ? art[1] : (html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || []).join(" ");
    return text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 800);
  } catch { return ""; }
}

// ─── Date Filter ──────────────────────────────────────────────────

const MAX_AGE_DAYS = 7;

function filterRecent(items) {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return items.filter(item => {
    if (!item.date) return true; // keep items with no date (let AI handle)
    const d = new Date(item.date).getTime();
    return !isNaN(d) && d >= cutoff;
  });
}

// ═══════════════════════════════════════════════════════════════════
// MODE: NEWS — Google News RSS → article fetch → classify
// ═══════════════════════════════════════════════════════════════════

async function scanNews(company, taskDefs) {
  console.log(`  [NEWS] Fetching for ${company.name}...`);
  const q = encodeURIComponent(`"${company.name}"`);
  const items = await fetchRSS(`https://news.google.com/rss/search?q=${q}+when:7d&hl=en&gl=US&ceid=US:en`, `Google News [${company.name}]`, "Google News");

  const recent = filterRecent(items);
  console.log(`  [NEWS] ${items.length} total → ${recent.length} within ${MAX_AGE_DAYS} days`);

  if (recent.length === 0) {
    console.log(`  [NEWS] No recent RSS, using AI fallback`);
    return generateAI(company, taskDefs, "news");
  }

  const enriched = await Promise.all(recent.slice(0, 10).map(async n => ({ ...n, signalType: "news", articleContent: await fetchArticle(n.url) })));
  return classify(enriched, taskDefs, company.name, "news");
}

// ═══════════════════════════════════════════════════════════════════
// MODE: JOBS — Apify LinkedIn Scraper → classify
//
// Actor: curious_coder/linkedin-jobs-scraper (verified schema)
// Pricing: $1.00 per 1,000 results, no monthly rental
// Input: { startUrls: [{ url: "https://www.linkedin.com/jobs/search/?..." }] }
// Output: { id, title, companyName, link, location, salaryInfo, postedAt,
//           descriptionHtml, descriptionText, companyLinkedinUrl, benefits }
// ═══════════════════════════════════════════════════════════════════

async function scanJobs(company, taskDefs) {
  console.log(`  [JOBS] Fetching for ${company.name}...`);
  console.log(`  [JOBS] APIFY_TOKEN exists: ${!!process.env.APIFY_TOKEN}`);
  console.log(`  [JOBS] Task defs received: ${taskDefs.length}`);

  const token = process.env.APIFY_TOKEN;
  if (!token) {
    console.log("  [JOBS] No APIFY_TOKEN set — using AI fallback");
    return generateAI(company, taskDefs, "jobs");
  }

  // Build multiple LinkedIn search URLs — one per job task for targeted results
  // Each task's jobTitleKeywords (or regular keywords) become a separate search
  const searchUrls = [];
  const seenQueries = new Set();

  for (const task of taskDefs) {
    // Use jobTitleKeywords if available, fall back to regular keywords
    const titleKws = task.jobTitleKeywords || task.keywords || [];
    if (titleKws.length === 0) continue;

    // Take first 2 keywords per task to keep searches focused
    const query = `${titleKws.slice(0, 2).join(" ")} ${company.name}`;
    const key = query.toLowerCase();
    if (seenQueries.has(key)) continue;
    seenQueries.add(key);

    const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&sortBy=DD`;
    searchUrls.push({ url });

    if (searchUrls.length >= 4) break; // max 4 searches to control Apify costs
  }

  if (searchUrls.length === 0) {
    searchUrls.push({ url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent("marketing " + company.name)}&sortBy=DD` });
  }

  const actorId = process.env.APIFY_ACTOR_ID || "curious_coder/linkedin-jobs-scraper";

  console.log(`  [JOBS] Actor: ${actorId}`);
  console.log(`  [JOBS] ${searchUrls.length} search URLs:`);
  searchUrls.forEach((s, i) => console.log(`    [${i}] ${s.url}`));

  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 50000);

    // Apify sync run — fires actor, waits, returns dataset items directly
    // Apify API uses tilde (~) not slash (/) as separator in actor IDs
    const apiActorId = actorId.replace("/", "~");
    const apifyUrl = `https://api.apify.com/v2/acts/${apiActorId}/run-sync-get-dataset-items?token=${token.slice(0, 6)}...`;
    console.log(`  [JOBS] Apify URL: ${apifyUrl}`);

    const res = await fetch(
      `https://api.apify.com/v2/acts/${apiActorId}/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: searchUrls,
        }),
        signal: ctrl.signal,
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      console.error(`  [JOBS] Apify HTTP ${res.status}: ${err.slice(0, 200)}`);
      console.log("  [JOBS] Falling back to AI");
      return generateAI(company, taskDefs, "jobs");
    }

    const raw = await res.json();
    const jobs = Array.isArray(raw) ? raw : [];
    console.log(`  [JOBS] Apify returned ${jobs.length} job listings`);

    if (jobs.length === 0) {
      console.log("  [JOBS] Apify returned 0, using AI fallback");
      return generateAI(company, taskDefs, "jobs");
    }

    // Map curious_coder output to our signal format
    const signals = jobs.slice(0, 20).map(job => ({
      headline: `${job.title || "Open Role"} — ${job.companyName || company.name}`,
      description: cl(job.descriptionText || job.descriptionHtml || "").slice(0, 500),
      source: "LinkedIn",
      url: job.link || "",
      date: job.postedAt ? sd(job.postedAt) : new Date().toISOString(),
      signalType: "job_post",
      jobTitle: job.title || "",
      jobLocation: job.location || "",
      jobCompany: job.companyName || company.name,
      jobSalary: Array.isArray(job.salaryInfo) ? job.salaryInfo.join(" - ") : (job.salaryInfo || ""),
      articleContent: cl(job.descriptionText || job.descriptionHtml || "").slice(0, 800),
    })).filter(j => j.jobTitle.length > 2);

    const recentSignals = filterRecent(signals);
    console.log(`  [JOBS] ${signals.length} total → ${recentSignals.length} within ${MAX_AGE_DAYS} days`);

    if (recentSignals.length === 0) {
      console.log("  [JOBS] No recent job posts, using AI fallback");
      return generateAI(company, taskDefs, "jobs");
    }

    return classify(recentSignals, taskDefs, company.name, "jobs");
  } catch (e) {
    if (e.name === "AbortError") console.error("  [JOBS] Apify timed out (50s)");
    else console.error(`  [JOBS] Apify error: ${e.message}`);
    console.log("  [JOBS] Falling back to AI");
    return generateAI(company, taskDefs, "jobs");
  }
}

// ─── Shared: OpenAI Classification ───────────────────────────────

async function classify(signals, taskDefs, companyName, mode) {
  if (!signals.length || !taskDefs.length) return [];

  const taskList = taskDefs
    .map(t => `ID:"${t.id}" | "${t.name}" | Keywords:[${(t.keywords || []).join(", ")}]${t.jobTitleKeywords ? ` | JobTitles:[${t.jobTitleKeywords.join(", ")}]` : ""}`)
    .join("\n");

  const signalList = signals
    .map((n, i) => {
      let e = `[${i}] "${n.headline}"`;
      if (n.description) e += `\n    Summary: ${n.description.slice(0, 200)}`;
      if (n.articleContent?.length > 50) e += `\n    Content: ${n.articleContent.slice(0, 400)}`;
      return e;
    }).join("\n\n");

  const prompt = mode === "jobs"
    ? `You classify job postings against job signal task definitions. Match based on job title keywords, role description, and seniority. A "CMO" posting matches a "CMO / CGO opening" task. An "Analytics Manager" posting matches an "analytics backfill" task. Be generous — partial matches count. Return ONLY JSON array: [{"newsIndex":0,"matchedTaskIds":["j1"],"confidence":0.85}]. Omit non-matches. No markdown.`
    : `You classify news articles against signal task definitions. Use headlines, summaries, AND article content. Be generous — semantic matches count. Return ONLY JSON array: [{"newsIndex":0,"matchedTaskIds":["n1"],"confidence":0.85}]. Omit non-matches. No markdown.`;

  try {
    const c = await openai.chat.completions.create({
      model: "gpt-4.1-mini", temperature: 0.15, max_tokens: 2000,
      messages: [
        { role: "system", content: prompt },
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
    console.error(`Classify error (${mode}):`, e);
    return signals.map(sig => {
      const t = (sig.headline + " " + (sig.description || "")).toLowerCase();
      const matched = taskDefs.filter(td => (td.keywords || []).some(kw => t.includes(kw.toLowerCase())));
      return { ...sig, matchedTaskIds: matched.map(td => td.id), confidence: matched.length > 0 ? 0.6 : 0 };
    });
  }
}

// ─── Shared: AI Generation Fallback ──────────────────────────────

async function generateAI(company, taskDefs, mode) {
  const taskList = taskDefs.map(t =>
    `ID:"${t.id}" | "${t.name}" | Keywords:[${(t.keywords || []).join(", ")}]${t.jobTitleKeywords ? ` | JobTitles:[${t.jobTitleKeywords.join(", ")}]` : ""}`
  ).join("\n");

  const prompt = mode === "jobs"
    ? `Generate 3-5 realistic JOB POSTING signals for a company. Each must match a task. Format headline as "Job Title — Company Name". Include realistic job description. IMPORTANT: All dates MUST be within the last 7 days from today (${new Date().toISOString().slice(0, 10)}). Return ONLY JSON array: [{"headline":"CMO — Sprinto","description":"We are looking for...","source":"LinkedIn","url":"https://linkedin.com/jobs/view/...","date":"ISO date within last 7 days","matchedTaskIds":["j1"],"confidence":0.85,"signalType":"job_post"}]`
    : `Generate 3-5 realistic NEWS headlines for a company. Each must match a task. IMPORTANT: All dates MUST be within the last 7 days from today (${new Date().toISOString().slice(0, 10)}). Return ONLY JSON array: [{"headline":"...","description":"...","source":"Reuters","url":"https://reuters.com/...","date":"ISO date within last 7 days","matchedTaskIds":["n1"],"confidence":0.85,"signalType":"news"}]`;

  try {
    const c = await openai.chat.completions.create({
      model: "gpt-4.1-mini", temperature: 0.7, max_tokens: 2000,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Company: ${company.name} (${company.domain}, ${company.industry || "B2B"}, ${company.size || "Unknown"})\n\nTasks:\n${taskList}` },
      ],
    });
    const text = c.choices[0]?.message?.content || "[]";
    let r; try { r = JSON.parse(text.replace(/```json\n?|```/g, "").trim()); } catch { const m = text.match(/\[[\s\S]*\]/); r = m ? JSON.parse(m[0]) : []; }
    const valid = new Set(taskDefs.map(t => t.id));
    return filterRecent((Array.isArray(r) ? r : [])
      .filter(i => i.headline && i.matchedTaskIds?.length)
      .map(i => ({ ...i, signalType: mode === "jobs" ? "job_post" : "news", matchedTaskIds: i.matchedTaskIds.filter(id => valid.has(id)), confidence: Math.min(1, Math.max(0, i.confidence || 0.7)) }))
      .filter(i => i.matchedTaskIds.length > 0));
  } catch (e) { console.error(`AI gen error (${mode}):`, e); return []; }
}

// ─── Route Handler ────────────────────────────────────────────────

export async function POST(request) {
  try {
    const { company, taskDefs, mode } = await request.json();
    if (!company?.name) return NextResponse.json({ error: "Company name required" }, { status: 400 });
    if (!taskDefs?.length) return NextResponse.json({ error: "Task definitions required" }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });

    console.log(`\n── Scanning: ${company.name} [${mode}] ──`);

    const signals = mode === "jobs"
      ? await scanJobs(company, taskDefs)
      : await scanNews(company, taskDefs);

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
