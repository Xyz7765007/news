import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── RSS XML Parser ───────────────────────────────────────────────

function parseRSSItems(xml, defaultSource) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link") || extractTagAttr(itemXml, "link", "href");
    const pubDate = extractTag(itemXml, "pubDate") || extractTag(itemXml, "published");
    const description = extractTag(itemXml, "description") || extractTag(itemXml, "summary");
    const source = extractTag(itemXml, "source") || extractSourceFromTitle(title) || defaultSource || "News";

    if (title && title.length > 10) {
      items.push({
        headline: cleanHTML(title),
        description: cleanHTML(description || "").slice(0, 300),
        url: cleanHTML(link || ""),
        source: cleanHTML(source),
        date: pubDate ? safeDate(pubDate) : new Date().toISOString(),
      });
    }
  }
  return items;
}

function extractTag(xml, tag) {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(regex);
  return m ? m[1].trim() : "";
}

function extractTagAttr(xml, tag, attr) {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
  const m = xml.match(regex);
  return m ? m[1] : "";
}

function extractSourceFromTitle(title) {
  const m = title?.match(/\s[-–—]\s([^-–—]+)$/);
  return m ? m[1].trim() : "";
}

function cleanHTML(text) {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .trim();
}

function safeDate(str) {
  try {
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

async function fetchRSS(url, label, defaultSource) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, text/html, */*",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.error(`${label}: HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    if (!xml.includes("<item>") && !xml.includes("<entry>")) {
      console.error(`${label}: no items found (${xml.length} chars)`);
      return [];
    }
    const items = parseRSSItems(xml, defaultSource);
    console.log(`${label}: ${items.length} items`);
    return items;
  } catch (e) {
    console.error(`${label}: ${e.message}`);
    return [];
  }
}

// ─── Google News RSS (free, no key) ───────────────────────────────

async function fetchGoogleNews(companyName) {
  const q = encodeURIComponent(`"${companyName}"`);
  return fetchRSS(
    `https://news.google.com/rss/search?q=${q}+when:7d&hl=en&gl=US&ceid=US:en`,
    `Google News [${companyName}]`,
    "Google News"
  );
}

// ─── Indeed RSS for Job Posts (free, no key) ──────────────────────

/**
 * Indeed RSS returns real job listings with real URLs.
 * We search for marketing leadership + effectiveness roles
 * scoped to the company name.
 */
async function fetchIndeedJobs(companyName) {
  // Job title queries matching our task definitions for hiring signals
  const jobQueries = [
    `CMO OR "Chief Marketing Officer" OR "Chief Growth Officer"`,
    `"Marketing Mix" OR MMM OR Econometrics OR "Marketing Science" OR "Marketing Effectiveness"`,
    `"Marketing Transformation" OR "Marketing AI" OR MarTech OR "Marketing Automation"`,
    `"Interim CMO" OR "VP Marketing" OR "Head of Marketing"`,
    `"Marketing Analytics" OR "Marketing Analyst" OR Attribution OR Incrementality`,
  ];

  const allItems = [];
  for (const jobQuery of jobQueries) {
    if (allItems.length >= 10) break;
    const q = encodeURIComponent(`${jobQuery} company:${companyName}`);
    const items = await fetchRSS(
      `https://www.indeed.com/rss?q=${q}&sort=date&limit=5`,
      `Indeed [${companyName}: ${jobQuery.slice(0, 30)}...]`,
      "Indeed"
    );
    allItems.push(
      ...items.map((item) => ({
        ...item,
        signalType: "job_post",
        source: item.source || "Indeed",
      }))
    );
  }
  return allItems;
}

// ─── Google News RSS for Hiring Signals (supplement) ──────────────

async function fetchHiringNews(companyName) {
  const queries = [
    `"${companyName}" "hires" OR "appoints" OR "names" CMO OR "head of marketing" OR "chief marketing"`,
    `"${companyName}" hiring OR "new role" marketing OR growth OR effectiveness`,
  ];

  const allItems = [];
  for (const query of queries) {
    if (allItems.length >= 6) break;
    const q = encodeURIComponent(query);
    const items = await fetchRSS(
      `https://news.google.com/rss/search?q=${q}+when:30d&hl=en&gl=US&ceid=US:en`,
      `Hiring News [${companyName}]`,
      "Google News"
    );
    allItems.push(
      ...items.map((item) => ({
        ...item,
        signalType: "job_post",
      }))
    );
  }
  return allItems;
}

// ─── Article Content Fetcher ──────────────────────────────────────

/**
 * Fetches the actual article page and extracts the main text content.
 * This gives OpenAI the full context for much better classification.
 */
async function fetchArticleContent(url) {
  if (!url || url.length < 10) return "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return "";

    const html = await res.text();

    // Extract text from article-like tags, strip everything else
    let text = "";

    // Try <article> tag first (most news sites)
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      text = articleMatch[1];
    } else {
      // Fallback: grab all <p> tags
      const pTags = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
      text = pTags.join(" ");
    }

    // Clean HTML tags and normalize whitespace
    text = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Cap at ~800 chars to stay within token limits
    return text.slice(0, 800);
  } catch (e) {
    // Silently fail — content enrichment is optional
    return "";
  }
}

/**
 * Enrich signals with article content. Fetches top N articles in parallel.
 * Skips Google News redirect URLs and fetches the actual destination.
 */
async function enrichSignalsWithContent(signals, maxToFetch = 8) {
  const toFetch = signals.slice(0, maxToFetch);
  const results = await Promise.all(
    toFetch.map(async (signal) => {
      let url = signal.url || "";
      // Google News RSS URLs are redirects — try to extract the real URL
      if (url.includes("news.google.com/rss/articles/")) {
        // These redirect to the real article — fetch will follow redirect
      }
      const content = await fetchArticleContent(url);
      return { ...signal, articleContent: content };
    })
  );

  // Merge enriched signals back, keep un-fetched signals as-is
  return signals.map((sig, i) => (i < maxToFetch ? results[i] : sig));
}

// ─── OpenAI Classification ────────────────────────────────────────

async function classifySignals(signals, taskDefs, companyName) {
  if (!signals.length || !taskDefs.length) return [];

  // Enrich signals with article content before classification
  console.log(`  Fetching article content for up to ${Math.min(signals.length, 8)} articles...`);
  const enrichedSignals = await enrichSignalsWithContent(signals);
  const enrichedCount = enrichedSignals.filter(s => s.articleContent?.length > 50).length;
  console.log(`  Enriched ${enrichedCount}/${enrichedSignals.length} with article content`);

  const taskList = taskDefs
    .map(
      (t) =>
        `ID:"${t.id}" | Name:"${t.name}" | Description:"${t.description}" | Keywords:[${(t.keywords || []).join(", ")}]`
    )
    .join("\n");

  const signalList = enrichedSignals
    .map((n, i) => {
      let entry = `[${i}] ${n.signalType === "job_post" ? "[JOB POST]" : "[NEWS]"} "${n.headline}"`;
      if (n.description) entry += `\n    Summary: ${n.description.slice(0, 200)}`;
      if (n.articleContent && n.articleContent.length > 50) entry += `\n    Article excerpt: ${n.articleContent.slice(0, 500)}`;
      return entry;
    })
    .join("\n\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.15,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You are a B2B signal classification engine for a marketing effectiveness consultancy. You classify real news articles and job posts against sales task definitions.

You receive each signal with its headline, summary, and article excerpt (when available). Use ALL available content to make accurate classification decisions.

RULES:
1. Read the full article excerpt (not just the headline) to understand the actual content before matching.
2. Match each signal to task definitions using keywords, semantic meaning, and signal intent.
3. Be GENEROUS — if the article content is even loosely related to a task, include it with appropriate confidence.
4. A signal can match MULTIPLE tasks.
5. [JOB POST] signals are especially relevant for hiring tasks: t1 (CMO/CGO), t2 (MMM/effectiveness), t3 (AI marketing), t8 (interim CMO), t14 (exits), t16 (analytics backfill).
6. [NEWS] signals are relevant for ALL tasks, especially t4-t15.
7. Higher confidence (0.8-1.0) when article content clearly confirms the match. Lower (0.5-0.7) for headline-only or loose semantic matches.

Return ONLY a JSON array. One entry per signal matching at least one task:
{"newsIndex": 0, "matchedTaskIds": ["t1"], "confidence": 0.85}

Omit signals with zero matches. No markdown or backticks.`,
        },
        {
          role: "user",
          content: `Company: ${companyName}

Signals:
${signalList}

Tasks:
${taskList}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "[]";
    const cleaned = text.replace(/```json\n?|```/g, "").trim();

    let classifications;
    try {
      classifications = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\[[\s\S]*\]/);
      classifications = m ? JSON.parse(m[0]) : [];
    }

    if (!Array.isArray(classifications)) return [];
    const validIds = new Set(taskDefs.map((t) => t.id));

    return enrichedSignals.map((sig, i) => {
      const cls = classifications.find((c) => c.newsIndex === i);
      if (!cls) return { ...sig, matchedTaskIds: [], confidence: 0 };
      return {
        ...sig,
        matchedTaskIds: (cls.matchedTaskIds || []).filter((id) => validIds.has(id)),
        confidence: Math.min(1, Math.max(0, cls.confidence || 0.7)),
      };
    });
  } catch (e) {
    console.error("OpenAI classification error:", e);
    return keywordFallback(enrichedSignals, taskDefs);
  }
}

function keywordFallback(signals, taskDefs) {
  return signals.map((sig) => {
    const text = (sig.headline + " " + (sig.description || "")).toLowerCase();
    const matched = taskDefs.filter((t) =>
      (t.keywords || []).some((kw) => text.includes(kw.toLowerCase()))
    );
    return {
      ...sig,
      matchedTaskIds: matched.map((t) => t.id),
      confidence: matched.length > 0 ? 0.6 : 0,
    };
  });
}

// ─── AI-Generated Fallback ────────────────────────────────────────

async function generateAISignals(company, taskDefs) {
  const taskList = taskDefs
    .map((t) => `ID:"${t.id}" | Name:"${t.name}" | Keywords:[${(t.keywords || []).join(", ")}]`)
    .join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2500,
      messages: [
        {
          role: "system",
          content: `You are a B2B signal intelligence engine. Generate 4-6 realistic signals (mix of news and job posts) for a company that match the provided task definitions.

RULES:
1. Each signal MUST match at least one task. Use DIFFERENT tasks across signals.
2. Mix types: ~60% news articles, ~40% job postings.
3. Mention the company by name. Sound like real Bloomberg/Reuters/LinkedIn content.
4. Use realistic URLs from the source's domain.

Return ONLY a JSON array:
[{"headline":"...","description":"...","source":"Reuters|Bloomberg|LinkedIn|Indeed","url":"https://...","date":"ISO date within 7 days","matchedTaskIds":["t1"],"confidence":0.85,"signalType":"news|job_post"}]`,
        },
        {
          role: "user",
          content: `Company: ${company.name} (${company.domain}, ${company.industry || "B2B"}, ${company.size || "Unknown"} employees)\n\nTasks:\n${taskList}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "[]";
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    let results;
    try {
      results = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\[[\s\S]*\]/);
      results = m ? JSON.parse(m[0]) : [];
    }

    const validIds = new Set(taskDefs.map((t) => t.id));
    return (Array.isArray(results) ? results : [])
      .filter((r) => r.headline && Array.isArray(r.matchedTaskIds))
      .map((r) => ({
        ...r,
        matchedTaskIds: r.matchedTaskIds.filter((id) => validIds.has(id)),
        confidence: Math.min(1, Math.max(0, r.confidence || 0.7)),
      }))
      .filter((r) => r.matchedTaskIds.length > 0);
  } catch (e) {
    console.error("AI signal generation error:", e);
    return [];
  }
}

// ─── Main Route ───────────────────────────────────────────────────

export async function POST(request) {
  try {
    const { company, taskDefs } = await request.json();

    if (!company?.name)
      return NextResponse.json({ error: "Company name required" }, { status: 400 });
    if (!taskDefs?.length)
      return NextResponse.json({ error: "Task definitions required" }, { status: 400 });
    if (!process.env.OPENAI_API_KEY)
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });

    console.log(`\n── Scanning: ${company.name} ──`);

    // Step 1: Fetch real signals from free sources (parallel)
    const [googleNews, indeedJobs, hiringNews] = await Promise.all([
      fetchGoogleNews(company.name),
      fetchIndeedJobs(company.name),
      fetchHiringNews(company.name),
    ]);

    // Deduplicate
    const seen = new Set();
    const allSignals = [...googleNews, ...indeedJobs, ...hiringNews].filter((n) => {
      const key = n.headline.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`  Signals: ${allSignals.length} (News:${googleNews.length} Indeed:${indeedJobs.length} HiringNews:${hiringNews.length})`);

    let classifiedSignals;
    let source;

    if (allSignals.length >= 2) {
      classifiedSignals = await classifySignals(allSignals.slice(0, 15), taskDefs, company.name);
      source = "rss+openai";
      const matchCount = classifiedSignals.filter((n) => (n.matchedTaskIds || []).length > 0).length;
      console.log(`  Classified: ${matchCount}/${classifiedSignals.length} matched`);
    } else {
      console.log("  Low RSS results, using AI generation");
      classifiedSignals = await generateAISignals(company, taskDefs);
      source = "openai-generated";
      console.log(`  Generated: ${classifiedSignals.length} AI signals`);
    }

    return NextResponse.json({
      news: classifiedSignals,
      company: company.name,
      source,
      debug: {
        googleNewsCount: googleNews.length,
        indeedJobsCount: indeedJobs.length,
        hiringNewsCount: hiringNews.length,
        totalSignals: allSignals.length,
        matchedCount: classifiedSignals.filter((n) => (n.matchedTaskIds || []).length > 0).length,
      },
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
