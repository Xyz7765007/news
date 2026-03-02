import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Free News Sources (no API key needed) ────────────────────────

/**
 * Google News RSS — completely free, no key needed.
 * Returns real news articles with real URLs.
 */
async function fetchGoogleNewsRSS(companyName) {
  try {
    const query = encodeURIComponent(companyName);
    const url = `https://news.google.com/rss/search?q=${query}&hl=en&gl=US&ceid=US:en`;
    const res = await fetch(url, {
      headers: { "User-Agent": "SignalScope/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    return parseRSSItems(xml).slice(0, 10);
  } catch (e) {
    console.error("Google News RSS error:", e.message);
    return [];
  }
}

/**
 * Bing News RSS — free, no key needed.
 */
async function fetchBingNewsRSS(companyName) {
  try {
    const query = encodeURIComponent(companyName);
    const url = `https://www.bing.com/news/search?q=${query}&format=rss`;
    const res = await fetch(url, {
      headers: { "User-Agent": "SignalScope/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    return parseRSSItems(xml).slice(0, 10);
  } catch (e) {
    console.error("Bing News RSS error:", e.message);
    return [];
  }
}

/**
 * Simple RSS/XML parser — extracts items from RSS feed.
 * Works with both Google News and Bing News RSS formats.
 */
function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const pubDate = extractTag(itemXml, "pubDate");
    const description = extractTag(itemXml, "description");
    const source = extractTag(itemXml, "source") || extractSourceFromTitle(title);

    if (title && title.length > 10) {
      items.push({
        headline: cleanHTML(title),
        description: cleanHTML(description || "").slice(0, 300),
        url: link || "",
        source: source || "News",
        date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
  }

  return items;
}

function extractTag(xml, tag) {
  // Handle CDATA: <tag><![CDATA[content]]></tag>
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular: <tag>content</tag>
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function extractSourceFromTitle(title) {
  // Google News titles often end with " - Source Name"
  const dashMatch = title?.match(/\s-\s([^-]+)$/);
  return dashMatch ? dashMatch[1].trim() : "";
}

function cleanHTML(text) {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// ─── Classification via OpenAI ────────────────────────────────────

/**
 * Takes REAL news articles and classifies them against the user's task
 * definitions. This is what makes it work like the artifact — real news,
 * real classification, real URLs.
 */
async function classifyNewsAgainstTasks(newsItems, taskDefs, companyName) {
  if (!newsItems.length || !taskDefs.length) return [];

  const taskList = taskDefs
    .map(
      (t) =>
        `ID:"${t.id}" | Name:"${t.name}" | Keywords:[${(t.keywords || []).join(", ")}]`
    )
    .join("\n");

  const newsList = newsItems
    .map((n, i) => `[${i}] "${n.headline}"`)
    .join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `You are a B2B signal classification engine. You will receive a list of real news headlines about a company and a list of task definitions (sales signals to detect). 

For EACH news headline, determine if it matches any task definitions. Consider:
- Keyword matches (exact and semantic)
- Signal intent (does this headline indicate the same business event the task describes?)
- Be generous with matching — if a headline is even somewhat related to a task, include it.

Return ONLY a JSON array. One entry per news headline that matches at least one task. Each entry:
{
  "newsIndex": 0,
  "matchedTaskIds": ["task_id"],
  "confidence": 0.85
}

If a headline matches no tasks, omit it entirely. Do NOT include markdown or backticks.`,
        },
        {
          role: "user",
          content: `Company: ${companyName}

News Headlines:
${newsList}

Task Definitions:
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
      const match = cleaned.match(/\[[\s\S]*\]/);
      classifications = match ? JSON.parse(match[0]) : [];
    }

    if (!Array.isArray(classifications)) return [];

    const validTaskIds = new Set(taskDefs.map((t) => t.id));

    // Merge classifications back into news items
    return newsItems.map((news, i) => {
      const cls = classifications.find((c) => c.newsIndex === i);
      if (!cls) return { ...news, matchedTaskIds: [], confidence: 0 };
      return {
        ...news,
        matchedTaskIds: (cls.matchedTaskIds || []).filter((id) => validTaskIds.has(id)),
        confidence: Math.min(1, Math.max(0, cls.confidence || 0.7)),
      };
    });
  } catch (e) {
    console.error("Classification error:", e);
    // Fallback: keyword matching
    return newsItems.map((news) => {
      const text = (news.headline + " " + (news.description || "")).toLowerCase();
      const matched = taskDefs.filter((t) =>
        (t.keywords || []).some((kw) => text.includes(kw.toLowerCase()))
      );
      return {
        ...news,
        matchedTaskIds: matched.map((t) => t.id),
        confidence: matched.length > 0 ? 0.6 : 0,
      };
    });
  }
}

// ─── Fallback: AI-generated news (when RSS returns nothing) ───────

async function generateAINews(company, taskDefs) {
  const taskList = taskDefs
    .map(
      (t) =>
        `ID:"${t.id}" | Name:"${t.name}" | Keywords:[${(t.keywords || []).join(", ")}]`
    )
    .join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You are a B2B signal intelligence engine. Generate 3-5 realistic news headlines about a company that match the provided task definitions. Each headline MUST match at least one task. Use different tasks across headlines.

Return ONLY a JSON array:
[{
  "headline": "Realistic headline mentioning company name",
  "description": "1-2 sentence elaboration",
  "source": "Reuters|Bloomberg|TechCrunch|Financial Times",
  "url": "https://source-domain.com/realistic/path/company-slug",
  "date": "ISO date within last 7 days",
  "matchedTaskIds": ["task_id"],
  "confidence": 0.85
}]`,
        },
        {
          role: "user",
          content: `Company: ${company.name} (${company.domain}, ${company.industry || "B2B"})

Task Definitions:
${taskList}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "[]";
    const cleaned = text.replace(/```json\n?|```/g, "").trim();

    let results;
    try {
      results = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      results = match ? JSON.parse(match[0]) : [];
    }

    const validTaskIds = new Set(taskDefs.map((t) => t.id));
    return (Array.isArray(results) ? results : [])
      .filter((r) => r.headline && Array.isArray(r.matchedTaskIds))
      .map((r) => ({
        ...r,
        matchedTaskIds: r.matchedTaskIds.filter((id) => validTaskIds.has(id)),
        confidence: Math.min(1, Math.max(0, r.confidence || 0.7)),
      }))
      .filter((r) => r.matchedTaskIds.length > 0);
  } catch (e) {
    console.error("AI news generation error:", e);
    return [];
  }
}

// ─── Main Route Handler ───────────────────────────────────────────

export async function POST(request) {
  try {
    const { company, taskDefs } = await request.json();

    if (!company?.name) {
      return NextResponse.json({ error: "Company name required" }, { status: 400 });
    }
    if (!taskDefs?.length) {
      return NextResponse.json({ error: "Task definitions required" }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    // Step 1: Fetch REAL news from free RSS sources (parallel)
    const [googleNews, bingNews] = await Promise.all([
      fetchGoogleNewsRSS(company.name),
      fetchBingNewsRSS(company.name),
    ]);

    // Deduplicate by headline similarity
    const seen = new Set();
    const realNews = [...googleNews, ...bingNews].filter((n) => {
      const key = n.headline.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let classifiedNews;
    let source;

    if (realNews.length >= 2) {
      // Step 2a: Classify real news against task definitions via OpenAI
      classifiedNews = await classifyNewsAgainstTasks(
        realNews.slice(0, 12), // cap at 12 to keep API costs low
        taskDefs,
        company.name
      );
      source = "rss+openai";
    } else {
      // Step 2b: No real news found — fall back to AI-generated signals
      classifiedNews = await generateAINews(company, taskDefs);
      source = "openai-generated";
    }

    return NextResponse.json({
      news: classifiedNews,
      company: company.name,
      source,
      realNewsCount: realNews.length,
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
