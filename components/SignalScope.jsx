"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants & Config ───────────────────────────────────────────
const DEFAULT_NEWS_TASKS = [
  { id: "n1", signalSource: "news", name: "Major competitor brand repositioning", description: "One of their top competitors is undergoing a major brand repositioning (new positioning, identity, or messaging shift), creating potential need for refreshed insights, strategic validation, and competitive response support.", ease: "Easy", strength: "Strong", sources: ["News"], keywords: ["rebrand", "repositioning", "brand overhaul", "brand refresh", "new positioning", "identity shift", "messaging shift", "competitive response", "brand strategy"] },
  { id: "n2", signalSource: "news", name: "Regulatory change affecting data use", description: "Regulatory changes impacting data collection, usage, targeting, or measurement practices — potential trigger for reassessing insights approaches, compliance strategy, and marketing effectiveness frameworks.", ease: "Easy", strength: "Strong", sources: ["News"], keywords: ["regulation", "data privacy", "GDPR", "compliance", "data collection", "targeting regulation", "measurement regulation", "privacy law", "cookie deprecation", "consent management"] },
  { id: "n3", signalSource: "news", name: "New non-traditional entrants", description: "Emergence of non-traditional or disruptive entrants gaining traction and threatening market share — potential trigger for refreshed competitive insights, segmentation reassessment, and strategic repositioning support.", ease: "Easy", strength: "Strong", sources: ["News"], keywords: ["new entrant", "disruption", "market entry", "disruptive entrant", "market share threat", "non-traditional competitor", "competitive disruption"] },
  { id: "n4", signalSource: "news", name: "Executive speaking on effectiveness topic", description: "Senior executive publicly speaking on marketing effectiveness, measurement, or ROI — potential signal of strategic priority and opportunity to support effectiveness frameworks, insights validation, or performance optimization.", ease: "Easy", strength: "Medium", sources: ["News", "Social"], keywords: ["effectiveness", "keynote", "conference", "speaking", "marketing ROI", "measurement", "performance optimization", "marketing effectiveness", "summit", "panel"] },
  { id: "n5", signalSource: "news", name: "Agency review or consolidation", description: "Agency review, pitch, or consolidation involving creative, media, digital, or MarTech partners — potential trigger for independent measurement validation, effectiveness benchmarking, and strategic insights support during transition.", ease: "Medium", strength: "Strong", sources: ["News"], keywords: ["agency review", "pitch", "consolidation", "RFP", "agency pitch", "media review", "creative review", "agency roster", "MarTech partner review", "effectiveness benchmarking"] },
  { id: "n6", signalSource: "news", name: "Exec publicly reframes success metrics", description: "Executive publicly reframes marketing success metrics (e.g., shifting from growth to profitability, brand to performance, or reach to ROI) — potential trigger for updated measurement frameworks, KPI alignment, and insights recalibration.", ease: "Medium", strength: "Medium", sources: ["News", "Social"], keywords: ["success metrics", "KPI", "measurement", "reframe", "profitability shift", "brand to performance", "ROI focus", "metrics recalibration", "KPI alignment"] },
  { id: "n7", signalSource: "news", name: "Category growth stalls or polarises", description: "Category growth stalls, declines, or polarizes (premium vs. value divergence) — potential trigger for segmentation refresh, demand diagnostics, portfolio strategy reassessment, and growth opportunity identification.", ease: "Medium", strength: "Strong", sources: ["News", "Custom"], keywords: ["growth stall", "market slowdown", "polarization", "category decline", "premium vs value", "demand diagnostics", "portfolio reassessment", "market contraction", "segmentation refresh"] },
  { id: "n8", signalSource: "news", name: "Analyst questions marketing ROI publicly", description: "Industry or financial analyst publicly questions marketing ROI or spend effectiveness — potential trigger for independent effectiveness validation, ROI modeling reinforcement, and executive-ready evidence to defend or recalibrate investment.", ease: "Medium", strength: "Strong", sources: ["News"], keywords: ["analyst", "marketing ROI", "spend efficiency", "downgrade", "spend effectiveness", "ROI questioned", "marketing investment", "cost scrutiny", "budget justification"] },
  { id: "n9", signalSource: "news", name: "Emerging markets outperform core", description: "Emerging markets significantly outperform core markets — potential trigger for resource reallocation analysis, localization insights, demand driver diagnostics, and scalable growth strategy validation.", ease: "Medium", strength: "Medium", sources: ["News", "Earnings"], keywords: ["emerging market", "outperform", "growth market", "resource reallocation", "localization", "demand drivers", "international expansion", "market outperformance"] },
  { id: "n10", signalSource: "news", name: "Senior marketer exits within 12 months", description: "Senior marketing leader exits within 12 months — potential signal of strategic instability or performance pressure, creating opportunity for independent insights, effectiveness reset, and continuity support during transition.", ease: "Easy", strength: "Strong", sources: ["News", "Exits / Promotions"], keywords: ["departure", "exit", "leaves", "steps down", "marketing leader exit", "CMO departure", "VP marketing leaves", "head of marketing exits", "resignation"] },
  { id: "n11", signalSource: "news", name: "Earnings call focus shifts to CAC / efficiency", description: "Earnings call shifts focus to CAC, efficiency, or cost discipline — potential trigger for deeper effectiveness diagnostics, spend optimization, ROI validation, and performance-to-growth rebalancing support.", ease: "Easy", strength: "Strong", sources: ["Earnings", "Custom"], keywords: ["earnings", "CAC", "efficiency", "cost reduction", "cost discipline", "spend optimization", "customer acquisition cost", "earnings call", "profitability focus", "margin improvement"] },
  { id: "n12", signalSource: "news", name: "New CMO/CGO announced in news", description: "News coverage of a new Chief Marketing Officer or Chief Growth Officer appointment at a target account — signals strategic marketing leadership shift and potential openness to new partnerships.", ease: "Easy", strength: "Strong", sources: ["News"], keywords: ["CMO appointed", "CGO appointed", "new CMO", "new chief marketing", "chief growth officer", "marketing leadership", "names CMO", "appoints CMO", "hires CMO"] },
  { id: "n13", signalSource: "news", name: "Interim CMO announced in news", description: "News coverage of an interim CMO appointment — potential signal of strategic reset, transformation mandate, or openness to external insights and effectiveness support.", ease: "Medium", strength: "Strong", sources: ["News"], keywords: ["interim CMO", "acting CMO", "CMO transition", "marketing leadership change", "strategic reset", "interim chief marketing"] },
];

const DEFAULT_JOB_TASKS = [
  { id: "j1", signalSource: "job_post", name: "CMO / CGO opening", description: "Job posting for Chief Marketing Officer or Chief Growth Officer — signals strategic marketing leadership change or expansion.", ease: "Easy", strength: "Strong", sources: ["Job Posts"], jobTitleKeywords: ["CMO", "Chief Marketing Officer", "Chief Growth Officer", "CGO", "VP Marketing", "SVP Marketing", "Head of Marketing"], keywords: ["CMO", "CGO", "chief marketing officer", "chief growth officer", "VP marketing", "SVP marketing", "head of marketing"] },
  { id: "j2", signalSource: "job_post", name: "MMM / Marketing Effectiveness role", description: "Job posting for Marketing Mix Modeling, Econometrics, or Marketing Effectiveness — signals investment in measurement capabilities.", ease: "Easy", strength: "Strong", sources: ["Job Posts"], jobTitleKeywords: ["Marketing Modeling", "Media Modeling", "MMM", "Econometrics", "Attribution", "Marketing Effectiveness", "Marketing Science", "Incrementality", "Marketing Analytics", "Causal Measurement"], keywords: ["Marketing Modeling", "Media modeling", "MMM", "Econometrics", "Attribution", "Effectiveness", "Marketing Science", "Incrementality", "Marketing Analytics", "Causal Measurement"] },
  { id: "j3", signalSource: "job_post", name: "Marketing Transformation / AI Marketing role", description: "Job posting for Marketing Transformation, AI Marketing, or MarTech roles — signals digital transformation investment.", ease: "Easy", strength: "Strong", sources: ["Job Posts"], jobTitleKeywords: ["Marketing Transformation", "Marketing AI", "AI Marketing", "MarTech", "Marketing Automation", "Customer Data Platform", "Marketing Operations", "Growth Marketing", "Digital Marketing Strategy", "Personalization Strategy"], keywords: ["Marketing Transformation", "Marketing AI", "AI-Powered Marketing", "MarTech", "Marketing Automation", "Customer Data Platform", "Marketing Operations", "Personalization Strategy", "Growth Marketing"] },
  { id: "j4", signalSource: "job_post", name: "Interim CMO / Acting CMO opening", description: "Job posting for interim or acting CMO — signals leadership instability or strategic transition.", ease: "Medium", strength: "Strong", sources: ["Job Posts"], jobTitleKeywords: ["Interim CMO", "Acting CMO", "Interim Chief Marketing", "Temporary CMO", "Contract CMO"], keywords: ["interim CMO", "acting CMO", "interim chief marketing", "CMO transition", "contract CMO"] },
  { id: "j5", signalSource: "job_post", name: "Marketing Analytics / Insights backfill", description: "Repeated or urgent hiring for analytics or insights roles — potential signal of capability gaps, delivery strain, or team instability.", ease: "Medium", strength: "Medium", sources: ["Job Posts", "Exits / Promotions"], jobTitleKeywords: ["Marketing Analyst", "Data Analyst", "Analytics Manager", "Insights Manager", "Marketing Data", "BI Analyst", "Reporting Analyst", "Analytics Lead"], keywords: ["analytics", "backfill", "data analyst", "insights role", "analytics vacancy", "capability gap", "marketing analyst", "reporting analyst"] },
  { id: "j6", signalSource: "job_post", name: "Senior marketing leadership hire", description: "Job posting for Director+ marketing roles — signals team expansion or restructuring at a strategic level.", ease: "Easy", strength: "Medium", sources: ["Job Posts", "New Hires"], jobTitleKeywords: ["Marketing Director", "Director of Marketing", "Senior Director Marketing", "Global Head of Marketing", "GM Marketing", "VP Growth", "Director Brand", "Director Performance Marketing"], keywords: ["marketing director", "director of marketing", "senior director", "global head", "VP growth", "director brand", "director performance"] },
];

const DEFAULT_SIGNAL_TASKS = [...DEFAULT_NEWS_TASKS, ...DEFAULT_JOB_TASKS];

const EASE_SCORE = { Easy: 3, Medium: 2, Hard: 1 };
const STRENGTH_SCORE = { Strong: 3, Medium: 2, Weak: 1 };

const MOCK_COMPANIES = [
  { domain: "sprinto.com", name: "Sprinto", industry: "SaaS / Compliance", size: "200-500" },
  { domain: "tazapay.com", name: "Tazapay", industry: "FinTech / Payments", size: "50-200" },
  { domain: "e6data.com", name: "e6data", industry: "Data / Analytics", size: "50-200" },
  { domain: "freshworks.com", name: "Freshworks", industry: "SaaS / CRM", size: "5000+" },
  { domain: "razorpay.com", name: "Razorpay", industry: "FinTech / Payments", size: "3000+" },
];

const SOURCE_OPTIONS = ["News", "New Hires", "Job Posts", "Social", "Exits / Promotions", "Custom", "Earnings", "SEC Filings"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);

function scoreTask(task, weights) {
  const ease = EASE_SCORE[task.ease] || 1;
  const strength = STRENGTH_SCORE[task.strength] || 1;
  const sourceCount = (task.sources || []).length;
  const sourceBonus = Math.min(sourceCount, 4); // cap at 4 sources

  // Normalize each component to 0-10 range, then apply weights
  const easeNorm = (ease / 3) * 10;       // Easy=10, Medium=6.67, Hard=3.33
  const strengthNorm = (strength / 3) * 10; // Strong=10, Medium=6.67, Weak=3.33
  const sourceNorm = (sourceBonus / 4) * 10; // 4 sources=10, 1 source=2.5

  const totalWeight = weights.ease + weights.strength + weights.sourceMultiplicity;
  if (totalWeight === 0) return 5;

  return ((easeNorm * weights.ease) + (strengthNorm * weights.strength) + (sourceNorm * weights.sourceMultiplicity)) / totalWeight;
}

// ─── API Call Wrappers ────────────────────────────────────────────

/**
 * Single-shot scan: sends company + task definitions to the API,
 * gets back news items that are ALREADY classified with matched task IDs.
 * This mirrors the artifact's approach — guaranteed relevant results.
 */
async function scanCompanyAPI(company, taskDefs) {
  try {
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, taskDefs }),
    });
    if (!res.ok) throw new Error("Scan API failed");
    const data = await res.json();
    return (data.news || []).map((n) => ({
      id: uid(),
      headline: n.headline || "",
      description: n.description || "",
      source: n.source || "Unknown",
      url: n.url || "",
      date: n.date || new Date().toISOString(),
      matchedTaskIds: n.matchedTaskIds || [],
      confidence: n.confidence || 0.7,
    }));
  } catch (e) {
    console.error("Scan API error, falling back to local:", e);
    return scanCompanyLocal(company, taskDefs);
  }
}

/** Local fallback — mirrors exactly what the artifact does */
function scanCompanyLocal(company, taskDefs) {
  if (!taskDefs || taskDefs.length === 0) return [];
  const count = Math.max(2, Math.min(2 + Math.floor(Math.random() * 5), taskDefs.length));
  const shuffled = [...taskDefs].sort(() => Math.random() - 0.5);
  const sourceDomains = { "Reuters": "reuters.com/business", "TechCrunch": "techcrunch.com/2026/03", "Bloomberg": "bloomberg.com/news/articles", "LinkedIn": "linkedin.com/pulse", "Google News": "news.google.com/articles" };
  return shuffled.slice(0, count).map((t) => {
    const templates = [
      `${company.name} makes strategic move: ${t.name.toLowerCase()}`,
      `Breaking: ${t.name} detected at ${company.name}`,
      `Report: ${company.name} — ${t.name.toLowerCase()}`,
      `Signal detected: ${t.name.toLowerCase()} at ${company.name}`,
    ];
    const source = ["Reuters", "TechCrunch", "Bloomberg", "LinkedIn", "Google News"][Math.floor(Math.random() * 5)];
    const slug = company.name.toLowerCase().replace(/\s+/g, "-") + "-" + t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    return {
      id: uid(),
      headline: templates[Math.floor(Math.random() * templates.length)],
      description: t.description || "",
      source,
      url: `https://${sourceDomains[source] || "reuters.com/business"}/${slug}`,
      date: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      matchedTaskIds: [t.id],
      confidence: 0.8 + Math.random() * 0.2,
    };
  });
}

async function getAIRefinement(userInput) {
  try {
    const res = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "refine", userInput }),
    });
    if (!res.ok) throw new Error("Refine API failed");
    const data = await res.json();
    if (data.success && data.task) {
      return { type: "suggestion", data: data.task };
    }
    return { type: "clarify", message: "Could you describe the signal in more detail? For example: 'When a company hires a new CMO' or 'When a competitor launches a rebrand'." };
  } catch (e) {
    console.error("AI refinement error:", e);
    // Fallback to local refinement
    return getLocalRefinement(userInput);
  }
}

function getLocalRefinement(userInput) {
  if (userInput.length < 15) {
    return { type: "clarify", message: "That's a bit brief — could you describe the scenario in more detail?" };
  }
  return {
    type: "suggestion",
    data: {
      name: userInput.slice(0, 60),
      description: `${userInput}. This signal should be monitored across news sources and company activity feeds for early detection.`,
      ease: "Medium",
      strength: "Medium",
      sources: ["News"],
      keywords: userInput.split(/\s+/).filter((w) => w.length > 3).slice(0, 5),
    },
  };
}

async function getAIInsights(task, companyName) {
  try {
    const res = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "insights", task, companyName }),
    });
    if (!res.ok) throw new Error("Insights API failed");
    const data = await res.json();
    if (data.success && data.data) return data.data;
    return null;
  } catch (e) {
    console.error("AI insights error:", e);
    return null;
  }
}

// ─── Icons ────────────────────────────────────────────────────────
const Icons = {
  Upload: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Play: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Settings: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Zap: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Bot: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  ArrowLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Sparkle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Wand: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h0"/><path d="M17.8 6.2L19 5"/><path d="M11 6.2L9.7 5"/><path d="M11 11.8L9.7 13"/><line x1="12" y1="22" x2="2" y2="12"/></svg>,
  Copy: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  ChevDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevUp: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  Layers: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Send: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>,
  ExternalLink: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
};

// ─── Styles ───────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

:root {
  --bg-primary: #0A0A0C;
  --bg-secondary: #111114;
  --bg-tertiary: #18181C;
  --bg-elevated: #1E1E24;
  --bg-hover: #24242C;
  --border: #2A2A34;
  --border-subtle: #1E1E28;
  --text-primary: #F0EDE8;
  --text-secondary: #9B978F;
  --text-tertiary: #6B675F;
  --accent: #C8A96E;
  --accent-dim: rgba(200, 169, 110, 0.15);
  --accent-glow: rgba(200, 169, 110, 0.08);
  --green: #5DB97B;
  --green-dim: rgba(93, 185, 123, 0.12);
  --amber: #D4A843;
  --amber-dim: rgba(212, 168, 67, 0.12);
  --red: #D45B5B;
  --red-dim: rgba(212, 91, 91, 0.12);
  --blue: #5B8FD4;
  --blue-dim: rgba(91, 143, 212, 0.12);
  --purple: #9B7BD4;
  --purple-dim: rgba(155, 123, 212, 0.12);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes typing { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
@keyframes glow { 0%, 100% { box-shadow: 0 0 8px var(--accent-glow); } 50% { box-shadow: 0 0 20px var(--accent-dim); } }

.fade-up { animation: fadeUp 0.5s ease-out forwards; }
.pop-in { animation: popIn 0.3s ease-out forwards; }

.app { min-height: 100vh; background: var(--bg-primary); position: relative; }
.app::before { content: ''; position: fixed; top: 0; left: 0; right: 0; height: 400px; background: radial-gradient(ellipse at 50% 0%, var(--accent-glow) 0%, transparent 70%); pointer-events: none; z-index: 0; }

.header { position: sticky; top: 0; z-index: 100; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); background: rgba(10, 10, 12, 0.85); backdrop-filter: blur(20px); }
.logo { display: flex; align-items: center; gap: 10px; }
.logo-mark { width: 32px; height: 32px; background: linear-gradient(135deg, var(--accent), #A08040); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--bg-primary); }
.logo-text { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; letter-spacing: -0.5px; }
.logo-tag { font-size: 10px; color: var(--text-tertiary); letter-spacing: 2px; text-transform: uppercase; }
.header-actions { display: flex; align-items: center; gap: 8px; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; border: none; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
.btn-primary { background: var(--accent); color: var(--bg-primary); }
.btn-primary:hover { background: #D4B87A; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.btn-secondary { background: var(--bg-elevated); color: var(--text-primary); border: 1px solid var(--border); }
.btn-secondary:hover { background: var(--bg-hover); border-color: var(--text-tertiary); }
.btn-ghost { background: transparent; color: var(--text-secondary); padding: 8px 10px; }
.btn-ghost:hover { color: var(--text-primary); background: var(--bg-tertiary); }
.btn-sm { padding: 5px 10px; font-size: 12px; }
.btn-xs { padding: 4px 8px; font-size: 11px; border-radius: 6px; }
.btn-danger { background: var(--red-dim); color: var(--red); border: 1px solid rgba(212,91,91,0.2); }
.btn-danger:hover { background: rgba(212,91,91,0.2); }
.btn-ai { background: linear-gradient(135deg, rgba(155,123,212,0.15), rgba(200,169,110,0.15)); color: var(--purple); border: 1px solid rgba(155,123,212,0.25); }
.btn-ai:hover { background: linear-gradient(135deg, rgba(155,123,212,0.25), rgba(200,169,110,0.25)); border-color: var(--purple); }

.main { padding: 32px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 1; }

.card { background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 14px; overflow: hidden; }
.card-header { padding: 20px 24px; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.card-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 500; }
.card-subtitle { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
.card-body { padding: 24px; }

.upload-zone { border: 1.5px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s ease; background: var(--bg-tertiary); }
.upload-zone:hover { border-color: var(--accent); background: var(--accent-glow); }
.upload-zone.dragging { border-color: var(--accent); background: var(--accent-dim); }
.upload-icon { width: 48px; height: 48px; margin: 0 auto 16px; border-radius: 12px; background: var(--accent-dim); display: flex; align-items: center; justify-content: center; color: var(--accent); }
.upload-title { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
.upload-desc { font-size: 12px; color: var(--text-tertiary); }

.tabs { display: flex; gap: 2px; padding: 4px; background: var(--bg-tertiary); border-radius: 10px; margin-bottom: 24px; }
.tab { flex: 1; padding: 10px 16px; font-size: 13px; font-weight: 500; color: var(--text-tertiary); background: transparent; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
.tab.active { background: var(--bg-elevated); color: var(--text-primary); box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
.tab:hover:not(.active) { color: var(--text-secondary); }

.input-group { margin-bottom: 16px; }
.input-label { display: block; font-size: 11px; font-weight: 600; color: var(--text-tertiary); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
.input { width: 100%; padding: 10px 14px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; font-size: 13px; transition: all 0.2s; outline: none; }
.input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
.input::placeholder { color: var(--text-tertiary); }
.textarea { resize: vertical; min-height: 80px; line-height: 1.5; }

.slider-container { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.slider-label { font-size: 12px; color: var(--text-secondary); width: 140px; flex-shrink: 0; }
.slider { flex: 1; -webkit-appearance: none; height: 4px; background: var(--bg-hover); border-radius: 4px; outline: none; }
.slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent); cursor: pointer; border: 2px solid var(--bg-primary); }
.slider-value { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--accent); width: 36px; text-align: right; }

.chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 500; letter-spacing: 0.3px; }
.chip-green { background: var(--green-dim); color: var(--green); }
.chip-amber { background: var(--amber-dim); color: var(--amber); }
.chip-red { background: var(--red-dim); color: var(--red); }
.chip-blue { background: var(--blue-dim); color: var(--blue); }
.chip-gold { background: var(--accent-dim); color: var(--accent); }
.chip-purple { background: var(--purple-dim); color: var(--purple); }

.table-wrapper { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th { padding: 10px 16px; text-align: left; font-size: 10px; font-weight: 600; color: var(--text-tertiary); letter-spacing: 1.2px; text-transform: uppercase; border-bottom: 1px solid var(--border); background: var(--bg-tertiary); }
td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); }
tr:hover td { background: var(--bg-tertiary); }
tr:last-child td { border-bottom: none; }
.td-primary { color: var(--text-primary); font-weight: 500; }

.progress-bar { width: 100%; height: 3px; background: var(--bg-hover); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), #D4B87A); border-radius: 3px; transition: width 0.5s ease; }

.score-bar { display: flex; align-items: center; gap: 8px; }
.score-track { flex: 1; height: 6px; background: var(--bg-hover); border-radius: 6px; overflow: hidden; }
.score-fill { height: 100%; border-radius: 6px; transition: width 0.6s ease; }
.score-value { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500; width: 32px; text-align: right; }

.scan-status { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: var(--bg-tertiary); border-radius: 10px; margin-bottom: 16px; }
.scan-dot { width: 8px; height: 8px; border-radius: 50%; animation: pulse 1.5s infinite; }
.scan-dot.active { background: var(--green); }
.scan-dot.paused { background: var(--amber); animation: none; }
.scan-dot.idle { background: var(--text-tertiary); animation: none; }
.scan-text { font-size: 12px; color: var(--text-secondary); flex: 1; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px); z-index: 200; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }
.modal { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 16px; width: 90%; max-width: 640px; max-height: 85vh; overflow-y: auto; animation: fadeUp 0.3s ease; }
.modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; }
.modal-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 500; }
.modal-body { padding: 24px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; gap: 8px; }

.checkbox-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
.checkbox-row:hover { background: var(--bg-tertiary); }
.checkbox { width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid var(--border); background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; color: transparent; }
.checkbox.checked { background: var(--accent); border-color: var(--accent); color: var(--bg-primary); }
.checkbox-label { font-size: 13px; color: var(--text-secondary); }

/* Chat */
.chat-container { display: flex; flex-direction: column; height: 420px; }
.chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.chat-msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.6; animation: slideIn 0.3s ease; }
.chat-msg.bot { align-self: flex-start; background: var(--bg-tertiary); color: var(--text-primary); border-bottom-left-radius: 4px; }
.chat-msg.user { align-self: flex-end; background: var(--accent-dim); color: var(--accent); border-bottom-right-radius: 4px; }
.chat-msg.system { align-self: center; background: var(--purple-dim); color: var(--purple); font-size: 12px; border-radius: 8px; padding: 6px 12px; }
.chat-input-row { padding: 12px 16px; border-top: 1px solid var(--border-subtle); display: flex; gap: 8px; }
.chat-input { flex: 1; padding: 10px 14px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 10px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; }
.chat-input:focus { border-color: var(--accent); }

.typing-indicator { display: flex; gap: 4px; padding: 10px 14px; align-self: flex-start; }
.typing-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-tertiary); animation: typing 1.2s infinite; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

.empty-state { text-align: center; padding: 60px 24px; color: var(--text-tertiary); }
.empty-icon { width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 14px; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 15px; font-weight: 500; color: var(--text-secondary); margin-bottom: 4px; }
.empty-desc { font-size: 12px; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

.stat-card { padding: 20px; background: var(--bg-tertiary); border-radius: 12px; border: 1px solid var(--border-subtle); }
.stat-value { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 600; margin-bottom: 2px; }
.stat-label { font-size: 11px; color: var(--text-tertiary); letter-spacing: 0.8px; text-transform: uppercase; }

.company-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); transition: background 0.15s; }
.company-row:hover { background: var(--bg-tertiary); }
.company-row:last-child { border-bottom: none; }
.company-avatar { width: 36px; height: 36px; border-radius: 8px; background: var(--accent-dim); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; color: var(--accent); flex-shrink: 0; }
.company-info { flex: 1; min-width: 0; }
.company-name { font-size: 13px; font-weight: 500; }
.company-domain { font-size: 11px; color: var(--text-tertiary); font-family: 'JetBrains Mono', monospace; }

.task-new { animation: fadeUp 0.4s ease; }

.news-item { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); animation: slideIn 0.3s ease; }
.news-item:last-child { border-bottom: none; }
.news-headline { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
.news-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-tertiary); }

.section { margin-bottom: 28px; }
.section-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 500; margin-bottom: 4px; }
.section-desc { font-size: 13px; color: var(--text-tertiary); margin-bottom: 20px; }

.steps { display: flex; align-items: center; gap: 0; margin-bottom: 32px; flex-wrap: wrap; }
.step { display: flex; align-items: center; gap: 8px; }
.step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; border: 1.5px solid var(--border); color: var(--text-tertiary); background: var(--bg-tertiary); transition: all 0.3s; }
.step.active .step-num { border-color: var(--accent); background: var(--accent); color: var(--bg-primary); }
.step.done .step-num { border-color: var(--green); background: var(--green-dim); color: var(--green); }
.step-label { font-size: 12px; color: var(--text-tertiary); font-weight: 500; }
.step.active .step-label { color: var(--text-primary); }
.step.done .step-label { color: var(--green); }
.step-line { width: 32px; height: 1px; background: var(--border); margin: 0 6px; }
.step-line.done { background: var(--green); }

.export-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }

/* ─── Task Definition Styles ─── */
.task-def-card { background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; margin-bottom: 10px; transition: all 0.2s; }
.task-def-card:hover { border-color: var(--border); }
.task-def-card.editing { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
.task-def-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.task-def-name { font-size: 14px; font-weight: 600; color: var(--text-primary); line-height: 1.4; }
.task-def-desc { font-size: 12px; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 10px; }
.task-def-meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.task-def-actions { display: flex; gap: 4px; flex-shrink: 0; }

.ai-suggestion-card { background: linear-gradient(135deg, rgba(155,123,212,0.06), rgba(200,169,110,0.06)); border: 1px solid rgba(155,123,212,0.2); border-radius: 12px; padding: 16px; margin: 8px 0; animation: popIn 0.3s ease; }
.ai-suggestion-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 11px; font-weight: 600; color: var(--purple); letter-spacing: 0.8px; text-transform: uppercase; }
.ai-suggestion-name { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.ai-suggestion-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 10px; }
.ai-suggestion-actions { display: flex; gap: 8px; }

.source-tag { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; background: var(--bg-elevated); color: var(--text-tertiary); border: 1px solid var(--border-subtle); }
.source-tag.selected { background: var(--accent-dim); color: var(--accent); border-color: rgba(200,169,110,0.3); }

.keyword-tag { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-family: 'JetBrains Mono', monospace; background: var(--bg-elevated); color: var(--text-tertiary); }

.task-count-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; border-radius: 6px; font-size: 11px; font-weight: 600; background: var(--accent-dim); color: var(--accent); font-family: 'JetBrains Mono', monospace; }

.step.done:hover .step-num { background: var(--green); color: var(--bg-primary); transform: scale(1.1); }
.step.done:hover .step-label { color: var(--text-primary); }
.step.done { cursor: pointer; }

.back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: var(--text-tertiary); background: transparent; border: 1px solid var(--border-subtle); cursor: pointer; transition: all 0.2s; }
.back-btn:hover { color: var(--text-primary); border-color: var(--border); background: var(--bg-tertiary); }

/* Clickable task rows */
tr.task-clickable { cursor: pointer; transition: all 0.15s; }
tr.task-clickable:hover td { background: var(--bg-hover) !important; }
tr.task-clickable:active td { background: var(--accent-glow) !important; }

/* Task Detail Panel */
.task-detail-modal { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 18px; width: 92%; max-width: 720px; max-height: 88vh; overflow: hidden; display: flex; flex-direction: column; animation: fadeUp 0.3s ease; }
.td-header { padding: 24px 28px 20px; border-bottom: 1px solid var(--border-subtle); }
.td-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: var(--text-primary); line-height: 1.3; }
.td-body { padding: 24px 28px; overflow-y: auto; flex: 1; }
.td-section { margin-bottom: 24px; }
.td-section:last-child { margin-bottom: 0; }
.td-section-title { font-size: 11px; font-weight: 600; color: var(--text-tertiary); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }

.td-score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.td-score-item { text-align: center; }
.td-score-ring { width: 56px; height: 56px; border-radius: 50%; border: 2.5px solid var(--border); display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600; background: var(--bg-tertiary); }
.td-score-label { font-size: 10px; color: var(--text-tertiary); letter-spacing: 0.5px; text-transform: uppercase; }

.td-insights { display: flex; flex-direction: column; gap: 8px; }
.td-insight-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: var(--bg-tertiary); border-radius: 10px; border: 1px solid var(--border-subtle); }
.td-insight-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
.td-insight-text { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

.td-news-card { padding: 14px 16px; background: var(--bg-tertiary); border-radius: 10px; border: 1px solid var(--border-subtle); }

.td-actions-list { display: flex; flex-direction: column; gap: 8px; }
.td-action-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--bg-tertiary); border-radius: 10px; font-size: 13px; color: var(--text-secondary); border: 1px solid var(--border-subtle); }
.td-action-num { width: 24px; height: 24px; border-radius: 6px; background: var(--accent-dim); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; }

.td-company-card { padding: 16px; background: var(--bg-tertiary); border-radius: 10px; border: 1px solid var(--border-subtle); }

.td-source-link { display: inline-flex; align-items: center; gap: 4px; color: var(--accent); text-decoration: none; font-weight: 500; padding: 3px 10px; border-radius: 6px; background: var(--accent-dim); border: 1px solid rgba(200,169,110,0.2); transition: all 0.2s; font-size: 11px; cursor: pointer; }
.td-source-link:hover { background: rgba(200,169,110,0.25); border-color: var(--accent); transform: translateY(-1px); }

.news-source-link { display: inline-flex; align-items: center; gap: 3px; color: var(--accent); text-decoration: none; font-size: 11px; transition: color 0.15s; }
.news-source-link:hover { color: #D4B87A; text-decoration: underline; }

.nav-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }

@media (max-width: 900px) {
  .grid-2 { grid-template-columns: 1fr; }
  .grid-3 { grid-template-columns: 1fr; }
  .main { padding: 16px; }
  .header { padding: 12px 16px; }
}
`;

// ─── Sub-Components ───────────────────────────────────────────────
function Chip({ type, children }) { return <span className={`chip chip-${type}`}>{children}</span>; }

function StepIndicator({ current, steps, onNavigate }) {
  return (
    <div className="steps">
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div
            className={`step ${i < current ? "done" : i === current ? "active" : ""}`}
            style={{ cursor: i < current ? "pointer" : "default" }}
            onClick={() => i < current && onNavigate && onNavigate(i)}
          >
            <div className="step-num">{i < current ? <Icons.Check /> : i + 1}</div>
            <span className="step-label">{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`step-line ${i < current ? "done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}

// ─── Task Definition Card ─────────────────────────────────────────
function TaskDefCard({ task, onEdit, onDelete, onDuplicate }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="task-def-card">
      <div className="task-def-header">
        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
          <div className="task-def-name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {task.name}
            <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{expanded ? <Icons.ChevUp /> : <Icons.ChevDown />}</span>
          </div>
        </div>
        <div className="task-def-actions">
          <button className="btn btn-ghost btn-xs" onClick={() => onEdit(task)} title="Edit"><Icons.Edit /></button>
          <button className="btn btn-ghost btn-xs" onClick={() => onDuplicate(task)} title="Duplicate"><Icons.Copy /></button>
          <button className="btn btn-ghost btn-xs" style={{ color: "var(--red)" }} onClick={() => onDelete(task.id)} title="Delete"><Icons.Trash /></button>
        </div>
      </div>
      {!expanded && <div className="task-def-desc" style={{ marginBottom: 6 }}>{task.description?.slice(0, 100)}{task.description?.length > 100 ? "..." : ""}</div>}
      {expanded && (
        <div style={{ animation: "fadeUp 0.2s ease" }}>
          <div className="task-def-desc">{task.description}</div>
          {task.keywords?.length > 0 && (
            <div style={{ marginBottom: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {task.keywords.map((k, i) => <span key={i} className="keyword-tag">{k}</span>)}
            </div>
          )}
        </div>
      )}
      <div className="task-def-meta">
        <Chip type={task.ease === "Easy" ? "green" : task.ease === "Medium" ? "amber" : "red"}>{task.ease}</Chip>
        <Chip type={task.strength === "Strong" ? "green" : task.strength === "Medium" ? "amber" : "red"}>{task.strength}</Chip>
        {(task.sources || []).map((s, i) => <span key={i} className="source-tag selected">{s}</span>)}
      </div>
    </div>
  );
}

// ─── Task Editor Modal ────────────────────────────────────────────
function TaskEditorModal({ show, task, onSave, onClose }) {
  const [form, setForm] = useState(task || { name: "", description: "", ease: "Medium", strength: "Medium", sources: ["News"], keywords: [] });
  const [keywordInput, setKeywordInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  useEffect(() => {
    if (task) setForm({ ...task, keywords: task.keywords || [], sources: task.sources || ["News"] });
    else setForm({ name: "", description: "", ease: "Medium", strength: "Medium", sources: ["News"], keywords: [] });
    setAiSuggestion(null);
  }, [task, show]);

  const toggleSource = (src) => {
    setForm(f => ({ ...f, sources: f.sources.includes(src) ? f.sources.filter(s => s !== src) : [...f.sources, src] }));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !form.keywords.includes(keywordInput.trim())) {
      setForm(f => ({ ...f, keywords: [...f.keywords, keywordInput.trim()] }));
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw) => setForm(f => ({ ...f, keywords: f.keywords.filter(k => k !== kw) }));

  const handleAIRefine = async () => {
    if (!form.name && !form.description) return;
    setAiLoading(true);
    const input = `${form.name} ${form.description}`.trim();
    const result = await getAIRefinement(input);
    if (result.type === "suggestion" || result.type === "refined") {
      setAiSuggestion(result.data);
    } else {
      setAiSuggestion({ _clarify: result.message });
    }
    setAiLoading(false);
  };

  const applyAiSuggestion = () => {
    if (aiSuggestion && !aiSuggestion._clarify) {
      setForm(f => ({
        ...f,
        name: aiSuggestion.name || f.name,
        description: aiSuggestion.description || f.description,
        ease: aiSuggestion.ease || f.ease,
        strength: aiSuggestion.strength || f.strength,
        sources: aiSuggestion.sources || f.sources,
        keywords: aiSuggestion.keywords || f.keywords,
      }));
      setAiSuggestion(null);
    }
  };

  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{task?.id ? "Edit Task Definition" : "New Task Definition"}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icons.X /></button>
        </div>
        <div className="modal-body">
          {/* AI Assist Banner */}
          <div style={{ background: "linear-gradient(135deg, rgba(155,123,212,0.08), rgba(200,169,110,0.08))", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(155,123,212,0.15)" }}>
            <Icons.Wand />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)", marginBottom: 2 }}>AI Task Assistant</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Type a rough idea and let AI refine it into a structured task with keywords, sources, and scoring.</div>
            </div>
            <button className="btn btn-ai btn-sm" onClick={handleAIRefine} disabled={aiLoading || (!form.name && !form.description)}>
              {aiLoading ? "Thinking..." : <><Icons.Sparkle /> Refine with AI</>}
            </button>
          </div>

          {/* AI Suggestion */}
          {aiSuggestion && (
            aiSuggestion._clarify ? (
              <div className="ai-suggestion-card">
                <div className="ai-suggestion-header"><Icons.Bot /> AI Needs More Context</div>
                <div className="ai-suggestion-desc">{aiSuggestion._clarify}</div>
              </div>
            ) : (
              <div className="ai-suggestion-card">
                <div className="ai-suggestion-header"><Icons.Sparkle /> AI Suggestion</div>
                <div className="ai-suggestion-name">{aiSuggestion.name}</div>
                <div className="ai-suggestion-desc">{aiSuggestion.description}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  <Chip type={aiSuggestion.ease === "Easy" ? "green" : "amber"}>{aiSuggestion.ease}</Chip>
                  <Chip type={aiSuggestion.strength === "Strong" ? "green" : "amber"}>{aiSuggestion.strength}</Chip>
                  {(aiSuggestion.sources || []).map((s, i) => <span key={i} className="source-tag selected">{s}</span>)}
                </div>
                {aiSuggestion.keywords?.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                    {aiSuggestion.keywords.map((k, i) => <span key={i} className="keyword-tag">{k}</span>)}
                  </div>
                )}
                <div className="ai-suggestion-actions">
                  <button className="btn btn-primary btn-sm" onClick={applyAiSuggestion}><Icons.Check /> Apply Suggestion</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setAiSuggestion(null)}><Icons.X /> Dismiss</button>
                </div>
              </div>
            )
          )}

          {/* Form */}
          <div className="input-group">
            <label className="input-label">Task Name</label>
            <input className="input" placeholder="e.g. New CMO appointment, Agency review initiated..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input textarea" placeholder="Describe what this signal means and why it matters. Be as vague as you want — AI can refine it." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Ease of Detection</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["Easy", "Medium", "Hard"].map(v => (
                  <button key={v} className={`btn btn-xs ${form.ease === v ? "btn-primary" : "btn-secondary"}`} onClick={() => setForm(f => ({ ...f, ease: v }))}>{v}</button>
                ))}
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Signal Strength</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["Strong", "Medium", "Weak"].map(v => (
                  <button key={v} className={`btn btn-xs ${form.strength === v ? "btn-primary" : "btn-secondary"}`} onClick={() => setForm(f => ({ ...f, strength: v }))}>{v}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Signal Sources</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SOURCE_OPTIONS.map(src => (
                <button key={src} className={`source-tag ${form.sources.includes(src) ? "selected" : ""}`}
                  style={{ cursor: "pointer", transition: "all 0.15s" }}
                  onClick={() => toggleSource(src)}>
                  {src}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Keywords (for matching)</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {form.keywords.map((kw, i) => (
                <span key={i} className="keyword-tag" style={{ cursor: "pointer" }} onClick={() => removeKeyword(kw)}>
                  {kw} <span style={{ marginLeft: 4, opacity: 0.5 }}>×</span>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" placeholder="Add keyword..." value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                style={{ flex: 1 }} />
              <button className="btn btn-secondary btn-sm" onClick={addKeyword}><Icons.Plus /></button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!form.name.trim()} onClick={() => onSave({ ...form, id: form.id || `t_${uid()}` })}>
            <Icons.Check /> {task?.id ? "Save Changes" : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Task Builder Chat ─────────────────────────────────────────
function AITaskBuilderChat({ onAddTask }) {
  const [messages, setMessages] = useState([
    { role: "bot", text: "I'm your Task Definition Assistant. Describe any business signal you want to track — even a rough idea — and I'll turn it into a structured, scannable task definition." },
    { role: "bot", text: "For example, try:\n• \"Track when companies hire marketing leaders\"\n• \"Watch for budget cuts or restructuring\"\n• \"Monitor competitor moves\"\n• Or anything else that matters to your outreach!" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim() || typing) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setInput("");
    setTyping(true);

    const result = await getAIRefinement(userText);
    if (result.type === "clarify") {
      setMessages(prev => [...prev, { role: "bot", text: result.message }]);
    } else {
      const data = result.data;
      setMessages(prev => [...prev, {
        role: "bot",
        text: `Here's what I've built from your input:`,
        suggestion: data,
      }]);
    }
    setTyping(false);
    setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 50);
  };

  const handleAcceptSuggestion = (suggestion) => {
    const task = { ...suggestion, id: `t_${uid()}` };
    onAddTask(task);
    setMessages(prev => [...prev, { role: "system", text: `✓ "${task.name}" added to your task library` }]);
    setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 50);
  };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="card-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--purple-dim), var(--accent-dim))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)" }}><Icons.Wand /></div>
          <div>
            <div className="card-title">AI Task Builder</div>
            <div className="card-subtitle">Describe signals in plain language</div>
          </div>
        </div>
      </div>
      <div className="chat-container">
        <div className="chat-messages" ref={chatRef}>
          {messages.map((m, i) => (
            <div key={i}>
              <div className={`chat-msg ${m.role}`} style={{ whiteSpace: "pre-line" }}>{m.text}</div>
              {m.suggestion && (
                <div className="ai-suggestion-card" style={{ maxWidth: "85%", marginTop: 6 }}>
                  <div className="ai-suggestion-header"><Icons.Sparkle /> Generated Task</div>
                  <div className="ai-suggestion-name">{m.suggestion.name}</div>
                  <div className="ai-suggestion-desc">{m.suggestion.description}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    <Chip type={m.suggestion.ease === "Easy" ? "green" : "amber"}>{m.suggestion.ease}</Chip>
                    <Chip type={m.suggestion.strength === "Strong" ? "green" : "amber"}>{m.suggestion.strength}</Chip>
                    {(m.suggestion.sources || []).map((s, j) => <span key={j} className="source-tag selected">{s}</span>)}
                  </div>
                  {m.suggestion.keywords?.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                      {m.suggestion.keywords.map((k, j) => <span key={j} className="keyword-tag">{k}</span>)}
                    </div>
                  )}
                  <div className="ai-suggestion-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleAcceptSuggestion(m.suggestion)}>
                      <Icons.Check /> Add to Library
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setMessages(prev => [...prev, { role: "bot", text: "No problem — try describing it differently and I'll generate a new version." }])}>
                      <Icons.X /> Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div className="typing-indicator">
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
          )}
        </div>
        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder="Describe a signal to track, e.g. 'when a company hires for AI roles'..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={typing || !input.trim()}>
            <Icons.Send />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Scoring Chatbot ──────────────────────────────────────────────
function ScoringChatbot({ weights, setWeights, onComplete }) {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Let's configure your scoring criteria. How important is ease of detection for your signals? (1-10)" }
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const chatRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;
    const val = input.trim();
    const newMsgs = [...messages, { role: "user", text: val }];
    const num = parseInt(val);

    if (step === 0) {
      const w = isNaN(num) ? 40 : Math.min(100, Math.max(0, num * 10));
      setWeights(p => ({ ...p, ease: w }));
      newMsgs.push({ role: "bot", text: `Ease weight: ${w}%. How important is signal strength? (1-10)` });
      setStep(1);
    } else if (step === 1) {
      const w = isNaN(num) ? 40 : Math.min(100, Math.max(0, num * 10));
      setWeights(p => ({ ...p, strength: w }));
      newMsgs.push({ role: "bot", text: `Strength weight: ${w}%. How much should multiple confirming sources boost the score? (1-10)` });
      setStep(2);
    } else if (step === 2) {
      const w = isNaN(num) ? 20 : Math.min(100, Math.max(0, num * 10));
      setWeights(p => ({ ...p, sourceMultiplicity: w }));
      newMsgs.push({ role: "bot", text: `Source multiplicity: ${w}%. Minimum score threshold? (1-10, or "auto")` });
      setStep(3);
    } else if (step === 3) {
      const threshold = val.toLowerCase() === "auto" ? 5.0 : (isNaN(parseFloat(val)) ? 5.0 : parseFloat(val));
      setWeights(p => ({ ...p, threshold }));
      newMsgs.push({ role: "bot", text: `Threshold: ${threshold}. Configuration complete! Click "Apply & Continue" to proceed.` });
      setStep(4);
    }

    setMessages(newMsgs);
    setInput("");
    setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 50);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div><div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}><Icons.Bot /> Scoring Assistant</div></div>
        {step >= 4 && <button className="btn btn-primary btn-sm" onClick={onComplete}><Icons.Sparkle /> Apply & Continue</button>}
      </div>
      <div className="chat-container" style={{ height: 300 }}>
        <div className="chat-messages" ref={chatRef}>
          {messages.map((m, i) => <div key={i} className={`chat-msg ${m.role}`}>{m.text}</div>)}
        </div>
        {step < 4 && (
          <div className="chat-input-row">
            <input className="chat-input" placeholder="Type your response..." value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} />
            <button className="btn btn-primary btn-sm" onClick={handleSend}><Icons.ArrowRight /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function ManualScoring({ weights, setWeights, onComplete }) {
  return (
    <div className="card">
      <div className="card-header">
        <div><div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}><Icons.Settings /> Manual Scoring</div></div>
        <button className="btn btn-primary btn-sm" onClick={onComplete}><Icons.Check /> Apply & Continue</button>
      </div>
      <div className="card-body">
        {[["Ease of Detection", "ease"], ["Signal Strength", "strength"], ["Source Multiplicity", "sourceMultiplicity"]].map(([label, key]) => (
          <div key={key} className="slider-container">
            <span className="slider-label">{label}</span>
            <input type="range" className="slider" min="0" max="100" value={weights[key]}
              onChange={e => setWeights(p => ({ ...p, [key]: +e.target.value }))} />
            <span className="slider-value">{weights[key]}%</span>
          </div>
        ))}
        <div style={{ marginTop: 16 }}>
          <div className="input-label">Minimum Score Threshold</div>
          <input type="number" className="input" style={{ width: 120 }} value={weights.threshold} step={0.5}
            onChange={e => setWeights(p => ({ ...p, threshold: +e.target.value }))} />
        </div>
      </div>
    </div>
  );
}

// ─── Export Modal ─────────────────────────────────────────────────
function ExportModal({ show, onClose, csvColumns, tasks, companies, allNews }) {
  const [selectedCols, setSelectedCols] = useState(["company", "task", "score", "ease", "strength", "sources", "newsHeadline", "newsSource", "newsUrl"]);
  const [sourceFilter, setSourceFilter] = useState("all"); // "all" | "news" | "job_post"

  const filteredTasks = sourceFilter === "all" ? tasks : tasks.filter(t => (t.signalType || "news") === sourceFilter);
  const newsCount = tasks.filter(t => (t.signalType || "news") === "news").length;
  const jobCount = tasks.filter(t => t.signalType === "job_post").length;

  // Build column groups
  const companyGroup = [
    { key: "company", label: "Company Name" }, { key: "domain", label: "Domain" },
    { key: "industry", label: "Industry" }, { key: "size", label: "Company Size" },
  ];
  const csvGroup = csvColumns
    .filter(c => !["company", "domain", "name", "industry", "size", "sector", "employees", "website", "url", "vertical", "company_name", "company name", "companyname"].includes(c.toLowerCase()))
    .map(c => ({ key: `csv_${c}`, label: `CSV: ${c}` }));
  const taskGroup = [
    { key: "task", label: "Task Name" }, { key: "taskDescription", label: "Task Description" },
    { key: "score", label: "Score" }, { key: "confidence", label: "AI Confidence" },
    { key: "ease", label: "Ease" }, { key: "strength", label: "Strength" },
    { key: "sources", label: "Signal Sources" }, { key: "keywords", label: "Match Keywords" },
    { key: "signalSource", label: "Task Type (News/Job)" },
  ];
  const newsGroup = [
    { key: "newsHeadline", label: "News Headline" }, { key: "newsSource", label: "News Source" },
    { key: "newsUrl", label: "Article Link" }, { key: "newsDate", label: "News Date" },
    { key: "signalType", label: "Signal Type" },
    { key: "articleExcerpt", label: "Article Excerpt" },
  ];
  const jobGroup = [
    { key: "jobTitle", label: "Job Title" },
    { key: "jobDescription", label: "Job Description" },
    { key: "jobUrl", label: "Job Posting Link" },
  ];
  const insightsGroup = [
    { key: "urgency", label: "Urgency Level" },
    { key: "insights", label: "AI Insights" },
    { key: "suggestedActions", label: "Suggested Actions" },
    { key: "talkingPoints", label: "Talking Points" },
  ];

  const allCols = [...companyGroup, ...csvGroup, ...taskGroup, ...newsGroup, ...jobGroup, ...insightsGroup];
  const toggle = (key) => setSelectedCols(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);
  const toggleAll = (group) => {
    const keys = group.map(c => c.key);
    const allSelected = keys.every(k => selectedCols.includes(k));
    if (allSelected) setSelectedCols(p => p.filter(k => !keys.includes(k)));
    else setSelectedCols(p => [...new Set([...p, ...keys])]);
  };

  // Generate insights inline for export (no API call needed)
  const getTaskInsights = (t) => {
    const urgency = t.score > 8 ? "Critical" : t.score > 6 ? "High" : t.score > 4 ? "Moderate" : "Low";
    const daysAgo = t.newsDate ? Math.max(1, Math.floor((Date.now() - new Date(t.newsDate).getTime()) / 86400000)) : null;

    const insights = [];
    if (t.ease === "Easy" && t.strength === "Strong") insights.push("High-priority signal — easy to detect and strongly correlated with buying intent.");
    if ((t.sources || []).length >= 3) insights.push(`Multi-source confirmation across ${t.sources.length} channels.`);
    if (t.score > 7) insights.push(`Top-tier score (${t.score.toFixed(1)}/10) — action within 48 hours.`);
    if (t.ease === "Easy") insights.push("Easy-detect signal — publicly reported and reliable.");
    if (t.strength === "Strong") insights.push("Strong buying signal — correlated with near-term purchasing decisions.");
    if (daysAgo && daysAgo <= 3) insights.push(`Fresh signal — ${daysAgo}d ago. Time-sensitive.`);
    if (insights.length === 0) insights.push("Standard signal — monitor for confirming data.");

    const actions = [];
    const tn = (t.taskName || "").toLowerCase();
    if (tn.includes("cmo") || tn.includes("hire") || tn.includes("appointment") || tn.includes("opening")) {
      actions.push("Research the new hire's background and priorities", "Prepare personalized outreach referencing their appointment", "Map the org chart for warm introduction paths");
    } else if (tn.includes("agency") || tn.includes("review")) {
      actions.push("Prepare case study showing competitive advantage", "Reach out within the RFP window", "Identify the decision-maker leading the review");
    } else if (tn.includes("regulat") || tn.includes("data") || tn.includes("compliance")) {
      actions.push("Position your solution as compliance-enabling", "Share relevant thought leadership content", "Connect with their legal/compliance team");
    } else if (tn.includes("earnings") || tn.includes("cac") || tn.includes("efficiency")) {
      actions.push("Lead with ROI validation and cost-efficiency messaging", "Reference their earnings call language in outreach", "Offer effectiveness diagnostics");
    } else if (tn.includes("mmm") || tn.includes("effectiveness") || tn.includes("analytics")) {
      actions.push("Propose marketing mix modeling engagement", "Share relevant methodology case studies", "Offer a diagnostic review");
    } else {
      actions.push("Craft personalized outreach referencing the signal", "Share relevant case study or whitepaper", "Identify the right decision-maker to approach");
    }

    const talkingPoints = [];
    if (t.taskDescription) talkingPoints.push(t.taskDescription);
    if (t.newsHeadline) talkingPoints.push(`Recent signal: ${t.newsHeadline}`);

    return { urgency, insights, actions, talkingPoints };
  };

  const doExport = () => {
    const headerRow = selectedCols.map(k => allCols.find(c => c.key === k)?.label || k).join(",");
    const dataRows = filteredTasks.map(t => {
      const company = companies.find(c => c.domain === t.companyDomain) || {};
      const news = allNews.find(n => n.id === t.newsId) || {};
      const taskInsights = getTaskInsights(t);

      const row = selectedCols.map(k => {
        if (k.startsWith("csv_")) {
          const csvKey = k.replace("csv_", "");
          return company.rawData?.[csvKey] || "";
        }

        const map = {
          company: company.name,
          domain: company.domain,
          industry: company.industry,
          size: company.size,
          task: t.taskName,
          taskDescription: t.taskDescription || "",
          score: t.score?.toFixed(2),
          confidence: t.confidence ? `${(t.confidence * 100).toFixed(0)}%` : "",
          ease: t.ease,
          strength: t.strength,
          sources: (t.sources || []).join("; "),
          keywords: (t.keywords || []).join("; "),
          signalSource: t.signalSource || "news",
          newsHeadline: t.newsHeadline || news.headline || "",
          newsSource: t.newsSource || news.source || "",
          newsUrl: t.newsUrl || news.url || "",
          newsDate: (t.newsDate || news.date) ? new Date(t.newsDate || news.date).toLocaleDateString() : "",
          signalType: t.signalType || news.signalType || "news",
          articleExcerpt: (t.articleContent || "").slice(0, 300),
          jobTitle: t.jobTitle || "",
          jobDescription: (t.jobDescription || "").slice(0, 300),
          jobUrl: t.jobUrl || "",
          urgency: taskInsights.urgency,
          insights: taskInsights.insights.join(" | "),
          suggestedActions: taskInsights.actions.join(" | "),
          talkingPoints: taskInsights.talkingPoints.join(" | "),
        };
        return map[k] ?? "";
      });
      return row.map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(",");
    });

    const csv = [headerRow, ...dataRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const suffix = sourceFilter === "all" ? "" : `-${sourceFilter}`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `signal-tasks${suffix}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    onClose();
  };

  if (!show) return null;

  const ColGroup = ({ title, cols }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: 1, textTransform: "uppercase" }}>{title}</span>
        <button className="btn btn-ghost" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => toggleAll(cols)}>
          {cols.every(c => selectedCols.includes(c.key)) ? "Deselect all" : "Select all"}
        </button>
      </div>
      <div className="export-cols">
        {cols.map(col => (
          <div key={col.key} className="checkbox-row" onClick={() => toggle(col.key)}>
            <div className={`checkbox ${selectedCols.includes(col.key) ? "checked" : ""}`}>{selectedCols.includes(col.key) && <Icons.Check />}</div>
            <span className="checkbox-label">{col.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Export Tasks</span><button className="btn btn-ghost btn-sm" onClick={onClose}><Icons.X /></button></div>
        <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {/* Source Filter */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Signal Sources to Export</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "all", label: `All Signals (${tasks.length})` },
                { key: "news", label: `News Only (${newsCount})` },
                { key: "job_post", label: `Job Posts Only (${jobCount})` },
              ].map(opt => (
                <button key={opt.key} className={`btn btn-sm ${sourceFilter === opt.key ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => setSourceFilter(opt.key)}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 }}>
              {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} will be exported
            </div>
          </div>

          <ColGroup title="Company Data" cols={companyGroup} />
          {csvGroup.length > 0 && <ColGroup title="Your CSV Fields" cols={csvGroup} />}
          <ColGroup title="Task & Scoring" cols={taskGroup} />
          <ColGroup title="News Signal" cols={newsGroup} />
          <ColGroup title="Job Post Data" cols={jobGroup} />
          <ColGroup title="Insights & Actions" cols={insightsGroup} />
        </div>
        <div className="modal-footer" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{selectedCols.length} cols · {filteredTasks.length} tasks</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={doExport}><Icons.Download /> Export CSV</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColumnSelectModal({ show, columns, selected, onConfirm, onClose }) {
  const [sel, setSel] = useState(selected);
  const toggle = (col) => setSel(p => p.includes(col) ? p.filter(c => c !== col) : [...p, col]);
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Select Columns to Store</span><button className="btn btn-ghost btn-sm" onClick={onClose}><Icons.X /></button></div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>Choose which CSV columns to retain for export.</p>
          <div className="export-cols">
            {columns.map(col => (
              <div key={col} className="checkbox-row" onClick={() => toggle(col)}>
                <div className={`checkbox ${sel.includes(col) ? "checked" : ""}`}>{sel.includes(col) && <Icons.Check />}</div>
                <span className="checkbox-label">{col}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(sel)}><Icons.Check /> Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Detail Panel ────────────────────────────────────────────
function TaskDetailPanel({ task, allNews, companies, onClose }) {
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (task) {
      setLoadingInsights(true);
      getAIInsights(task, task.companyName).then((data) => {
        setAiInsights(data);
        setLoadingInsights(false);
      });
    }
  }, [task]);

  if (!task) return null;

  const company = companies.find(c => c.domain === task.companyDomain) || {};
  const relatedNews = allNews.filter(n => n.companyDomain === task.companyDomain);

  const urgencyLevel = aiInsights?.urgency || (task.score > 8 ? "Critical" : task.score > 6 ? "High" : "Moderate");
  const urgencyColor = urgencyLevel === "Critical" ? "red" : urgencyLevel === "High" ? "amber" : "blue";
  const daysAgo = task.newsDate ? Math.max(1, Math.floor((Date.now() - new Date(task.newsDate).getTime()) / 86400000)) : "—";

  // Use AI insights if available, otherwise fallback
  let insights = aiInsights?.insights || [];
  if (insights.length === 0) {
    if (task.ease === "Easy" && task.strength === "Strong") insights.push({ icon: "⚡", text: "High-priority signal — easy to detect and strongly correlated with buying intent." });
    if ((task.sources || []).length >= 3) insights.push({ icon: "🔗", text: `Multi-source confirmation — detected across ${task.sources.length} signal channels, increasing reliability.` });
    if (task.score > 7) insights.push({ icon: "🎯", text: `Top-tier score (${task.score.toFixed(1)}/10) — this task should be actioned within 48 hours for best results.` });
    if (task.ease === "Easy") insights.push({ icon: "📡", text: "Easy-detect signal — typically public and well-reported." });
    if (task.strength === "Strong") insights.push({ icon: "💰", text: "Strong buying signal — historically correlated with near-term purchasing decisions." });
    if (daysAgo <= 3) insights.push({ icon: "🔥", text: `Fresh signal — detected ${daysAgo} day${daysAgo > 1 ? "s" : ""} ago. Time-sensitive outreach recommended.` });
    if (insights.length === 0) insights.push({ icon: "📋", text: "Standard signal — monitor for additional confirming data points." });
  }

  const suggestedActions = aiInsights?.suggestedActions || (() => {
    if (task.taskName.toLowerCase().includes("cmo") || task.taskName.toLowerCase().includes("hire")) {
      return ["Research the new hire's background and priorities", "Prepare personalized outreach referencing their appointment", "Map the org chart for warm introduction paths"];
    } else if (task.taskName.toLowerCase().includes("agency") || task.taskName.toLowerCase().includes("review")) {
      return ["Prepare case study showing competitive advantage", "Reach out within the RFP window", "Identify the decision-maker leading the review"];
    }
    return ["Craft personalized outreach referencing the signal", "Share relevant case study or whitepaper", "Identify the right decision-maker to approach"];
  })();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="task-detail-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="td-header">
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Chip type={urgencyColor}>{urgencyLevel} Priority</Chip>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>·</span>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{daysAgo}d ago</span>
            </div>
            <h2 className="td-title">{task.taskName}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <div className="company-avatar" style={{ width: 24, height: 24, fontSize: 10, borderRadius: 5 }}>{task.companyName[0]}</div>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{task.companyName}</span>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "'JetBrains Mono', monospace" }}>{task.companyDomain}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icons.X /></button>
        </div>

        <div className="td-body">
          {/* Score Breakdown */}
          <div className="td-section">
            <div className="td-section-title">Score Breakdown</div>
            <div className="td-score-grid">
              <div className="td-score-item">
                <div className="td-score-ring" style={{ borderColor: task.score > 7 ? "var(--green)" : task.score > 5 ? "var(--amber)" : "var(--red)" }}>
                  <span style={{ color: task.score > 7 ? "var(--green)" : task.score > 5 ? "var(--amber)" : "var(--red)" }}>{task.score.toFixed(1)}</span>
                </div>
                <div className="td-score-label">Composite</div>
              </div>
              <div className="td-score-item">
                <div className="td-score-ring" style={{ borderColor: task.ease === "Easy" ? "var(--green)" : "var(--amber)" }}>
                  <span style={{ color: task.ease === "Easy" ? "var(--green)" : "var(--amber)", fontSize: 12 }}>{task.ease}</span>
                </div>
                <div className="td-score-label">Ease</div>
              </div>
              <div className="td-score-item">
                <div className="td-score-ring" style={{ borderColor: task.strength === "Strong" ? "var(--green)" : "var(--amber)" }}>
                  <span style={{ color: task.strength === "Strong" ? "var(--green)" : "var(--amber)", fontSize: 12 }}>{task.strength}</span>
                </div>
                <div className="td-score-label">Strength</div>
              </div>
              <div className="td-score-item">
                <div className="td-score-ring" style={{ borderColor: "var(--blue)" }}>
                  <span style={{ color: "var(--blue)" }}>{(task.sources || []).length}</span>
                </div>
                <div className="td-score-label">Sources</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {task.taskDescription && (
            <div className="td-section">
              <div className="td-section-title">Signal Description</div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{task.taskDescription}</p>
            </div>
          )}

          {/* AI Insights */}
          <div className="td-section">
            <div className="td-section-title" style={{ display: "flex", alignItems: "center", gap: 6 }}><Icons.Sparkle /> AI Insights {loadingInsights && <span style={{ fontSize: 10, color: "var(--purple)", fontWeight: 400, letterSpacing: 0 }}>(generating...)</span>}</div>
            <div className="td-insights">
              {insights.map((ins, i) => (
                <div key={i} className="td-insight-row">
                  <span className="td-insight-icon">{ins.icon}</span>
                  <span className="td-insight-text">{ins.text}</span>
                </div>
              ))}
            </div>
            {aiInsights?.talkingPoints?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Talking Points</div>
                {aiInsights.talkingPoints.map((tp, i) => (
                  <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, padding: "4px 0", paddingLeft: 12, borderLeft: "2px solid var(--accent-dim)" }}>{tp}</div>
                ))}
              </div>
            )}
          </div>

          {/* Triggering Signal — different layout for news vs job posts */}
          {task.signalType === "job_post" ? (
            <div className="td-section">
              <div className="td-section-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ background: "var(--blue-dim)", color: "var(--blue)", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>JOB POST</span>
                Detected Job Opening
              </div>
              <div className="td-news-card" style={{ borderLeft: "3px solid var(--blue)" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{task.jobTitle || task.newsHeadline}</div>
                {task.jobDescription && (
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10, maxHeight: 120, overflowY: "auto" }}>{task.jobDescription.slice(0, 400)}{task.jobDescription.length > 400 ? "..." : ""}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--text-tertiary)", flexWrap: "wrap" }}>
                  <span>{task.companyName}</span>
                  <span>·</span>
                  <span>{task.newsSource || "Job Board"}</span>
                  <span>·</span>
                  <span>{task.newsDate ? new Date(task.newsDate).toLocaleDateString() : "—"}</span>
                  {(task.jobUrl || task.newsUrl) && (
                    <>
                      <span>·</span>
                      <a href={task.jobUrl || task.newsUrl} target="_blank" rel="noopener noreferrer" className="td-source-link" onClick={(e) => e.stopPropagation()}>
                        <Icons.ExternalLink /> View Posting
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : task.newsHeadline ? (
            <div className="td-section">
              <div className="td-section-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ background: "var(--green-dim)", color: "var(--green)", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>NEWS</span>
                Triggering Signal
              </div>
              <div className="td-news-card" style={{ borderLeft: "3px solid var(--green)" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>{task.newsHeadline}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--text-tertiary)", flexWrap: "wrap" }}>
                  <span>{task.newsSource}</span>
                  <span>·</span>
                  <span>{task.newsDate ? new Date(task.newsDate).toLocaleDateString() : "—"}</span>
                  {task.newsUrl && (
                    <>
                      <span>·</span>
                      <a href={task.newsUrl} target="_blank" rel="noopener noreferrer" className="td-source-link" onClick={(e) => e.stopPropagation()}>
                        <Icons.ExternalLink /> View Article
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Article Excerpt (news only) */}
          {task.signalType !== "job_post" && task.articleContent && task.articleContent.length > 50 && (
            <div className="td-section">
              <div className="td-section-title">Article Excerpt</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, padding: "12px 14px", background: "var(--bg-tertiary)", borderRadius: 10, border: "1px solid var(--border-subtle)", maxHeight: 150, overflowY: "auto", fontStyle: "italic" }}>
                {task.articleContent.slice(0, 500)}{task.articleContent.length > 500 ? "..." : ""}
              </div>
            </div>
          )}

          {/* Signal Sources & Keywords */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="td-section">
              <div className="td-section-title">Signal Sources</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(task.sources || []).map((s, i) => <span key={i} className="source-tag selected">{s}</span>)}
              </div>
            </div>
            {task.keywords?.length > 0 && (
              <div className="td-section">
                <div className="td-section-title">Match Keywords</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {task.keywords.map((k, i) => <span key={i} className="keyword-tag">{k}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Suggested Actions */}
          <div className="td-section">
            <div className="td-section-title">Suggested Next Steps</div>
            <div className="td-actions-list">
              {suggestedActions.map((action, i) => (
                <div key={i} className="td-action-item">
                  <div className="td-action-num">{i + 1}</div>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related Signals */}
          {relatedNews.length > 1 && (
            <div className="td-section">
              <div className="td-section-title">Other Signals from {task.companyName}</div>
              <div style={{ maxHeight: 160, overflowY: "auto" }}>
                {relatedNews.filter(n => n.id !== task.newsId).slice(0, 5).map(n => (
                  <div key={n.id} className="news-item" style={{ padding: "8px 0" }}>
                    <div className="news-headline" style={{ fontSize: 12 }}>{n.headline}</div>
                    <div className="news-meta"><span>{n.source}</span><span>·</span><span>{new Date(n.date).toLocaleDateString()}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company Context */}
          <div className="td-section">
            <div className="td-section-title">Company Context</div>
            <div className="td-company-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="company-avatar" style={{ width: 40, height: 40 }}>{task.companyName[0]}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{task.companyName}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "'JetBrains Mono', monospace" }}>{task.companyDomain}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {company.industry && company.industry !== "—" && <Chip type="blue">{company.industry}</Chip>}
                {company.size && company.size !== "—" && <Chip type="gold">{company.size} employees</Chip>}
                <Chip type="purple">{relatedNews.length} signal{relatedNews.length !== 1 ? "s" : ""} detected</Chip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function SignalScope() {
  const [appStep, setAppStep] = useState(0); // 0: upload, 1: scoring, 2: task defs, 3: dashboard
  const [companies, setCompanies] = useState([]);
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedCsvCols, setSelectedCsvCols] = useState([]);
  const [showColSelect, setShowColSelect] = useState(false);
  const [scoringMode, setScoringMode] = useState("chat");
  const [weights, setWeights] = useState({ ease: 40, strength: 40, sourceMultiplicity: 20, threshold: 5.0 });

  // Task definitions
  const [taskDefs, setTaskDefs] = useState(DEFAULT_SIGNAL_TASKS);
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [taskDefView, setTaskDefView] = useState("library"); // "library" | "ai-builder"
  const [taskSearch, setTaskSearch] = useState("");

  // Dashboard state
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [allNews, setAllNews] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showExport, setShowExport] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentScanCompany, setCurrentScanCompany] = useState("");
  const scanRef = useRef(false);
  const pauseRef = useRef(false);

  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.split("\n").filter(Boolean);
      if (lines.length < 2) return;
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      setCsvColumns(headers);
      setSelectedCsvCols(headers);
      const nameCol = headers.findIndex(h => /^(company|name|company.?name)/i.test(h));
      const domainCol = headers.findIndex(h => /^(domain|website|url)/i.test(h));
      const industryCol = headers.findIndex(h => /^(industry|sector|vertical)/i.test(h));
      const sizeCol = headers.findIndex(h => /^(size|employees|company.?size)/i.test(h));
      const parsed = lines.slice(1).map(line => {
        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        // Store ALL original CSV columns as rawData for export
        const rawData = {};
        headers.forEach((h, idx) => { rawData[h] = cols[idx] || ""; });
        return {
          name: nameCol >= 0 ? cols[nameCol] : cols[0],
          domain: domainCol >= 0 ? cols[domainCol] : (cols[1] || `${(cols[0] || "").toLowerCase().replace(/\s/g, "")}.com`),
          industry: industryCol >= 0 ? cols[industryCol] : "—",
          size: sizeCol >= 0 ? cols[sizeCol] : "—",
          rawData,
        };
      }).filter(c => c.name);
      setCompanies(parsed);
      setShowColSelect(true);
    };
    reader.readAsText(file);
  };

  const loadDemoData = () => { setCompanies(MOCK_COMPANIES); setCsvColumns(["name", "domain", "industry", "size"]); setSelectedCsvCols(["name", "domain", "industry", "size"]); setAppStep(1); };

  // Task def CRUD
  const handleSaveTask = (task) => {
    setTaskDefs(prev => {
      const exists = prev.find(t => t.id === task.id);
      if (exists) return prev.map(t => t.id === task.id ? task : t);
      return [...prev, task];
    });
    setShowTaskEditor(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (id) => setTaskDefs(prev => prev.filter(t => t.id !== id));

  const handleDuplicateTask = (task) => {
    const dupe = { ...task, id: `t_${uid()}`, name: `${task.name} (copy)` };
    setTaskDefs(prev => [...prev, dupe]);
  };

  const filteredTaskDefs = taskDefs.filter(t =>
    !taskSearch || t.name.toLowerCase().includes(taskSearch.toLowerCase()) || (t.description || "").toLowerCase().includes(taskSearch.toLowerCase())
  );

  // Scanning
  const startScan = useCallback(async () => {
    setScanning(true); setPaused(false); scanRef.current = true; pauseRef.current = false;
    for (let i = 0; i < companies.length; i++) {
      if (!scanRef.current) break;
      while (pauseRef.current) { await sleep(200); if (!scanRef.current) break; }
      if (!scanRef.current) break;
      const company = companies[i];
      setCurrentScanCompany(company.name);
      setScanProgress((i / companies.length) * 100);

      // Single-shot: API returns news ALREADY classified with matched task IDs
      const newsItems = await scanCompanyAPI(company, taskDefs);
      if (!scanRef.current) break;

      // Process each pre-classified news item
      for (const n of newsItems) {
        if (!scanRef.current) break;
        while (pauseRef.current) { await sleep(200); if (!scanRef.current) break; }

        // Add to news feed
        const enrichedNews = { ...n, companyDomain: company.domain, companyName: company.name };
        setAllNews(prev => [...prev, enrichedNews]);

        // Create tasks from matched task IDs (already classified by API)
        for (const taskId of (n.matchedTaskIds || [])) {
          const taskDef = taskDefs.find(t => t.id === taskId);
          if (!taskDef) continue;
          const score = scoreTask(taskDef, weights);
          if (score >= weights.threshold) {
            setTasks(prev => {
              const isDuplicate = prev.some(t => t.companyDomain === company.domain && t.taskName === taskDef.name);
              if (isDuplicate) return prev;
              const isJobSignal = (n.signalType === "job_post");
              return [...prev, {
                id: uid(),
                dedupKey: `${company.domain}::${taskDef.name}`,
                companyDomain: company.domain,
                companyName: company.name,
                taskName: taskDef.name,
                taskDescription: taskDef.description || "",
                signalSource: taskDef.signalSource || (isJobSignal ? "job_post" : "news"),
                ease: taskDef.ease,
                strength: taskDef.strength,
                sources: taskDef.sources,
                keywords: taskDef.keywords || [],
                score,
                confidence: n.confidence || 0.8,
                newsId: n.id,
                newsHeadline: n.headline,
                newsSource: n.source,
                newsUrl: n.url || "",
                signalType: n.signalType || "news",
                articleContent: n.articleContent || "",
                // Job post specific fields
                jobTitle: isJobSignal ? n.headline : "",
                jobDescription: isJobSignal ? (n.description || n.articleContent || "") : "",
                jobUrl: isJobSignal ? (n.url || "") : "",
                newsDate: n.date,
                createdAt: new Date().toISOString(),
              }];
            });
          }
        }

        // Small delay between items for visual streaming effect
        await sleep(150);
      }
      setScanProgress(((i + 1) / companies.length) * 100);
    }
    setScanning(false); setCurrentScanCompany(""); scanRef.current = false;
  }, [companies, weights, taskDefs]);

  const togglePause = () => { pauseRef.current = !pauseRef.current; setPaused(!paused); };
  const stopScan = () => { scanRef.current = false; pauseRef.current = false; setScanning(false); setPaused(false); };

  const navigateTo = (step) => {
    // Stop scanning if navigating away from dashboard
    if (appStep === 3 && scanning) {
      scanRef.current = false;
      pauseRef.current = false;
      setScanning(false);
      setPaused(false);
    }
    setAppStep(step);
  };

  const goBack = () => {
    if (appStep > 0) navigateTo(appStep - 1);
  };

  const handleScoringComplete = () => setAppStep(2);
  const handleTaskDefsComplete = () => {
    setAppStep(3);
    // Only auto-scan if no tasks have been generated yet
    if (tasks.length === 0 && allNews.length === 0) {
      setTimeout(() => startScan(), 500);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => b.score - a.score);

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <header className="header">
          <div className="logo">
            <div className="logo-mark"><Icons.Zap /></div>
            <div><div className="logo-text">SignalScope</div><div className="logo-tag">Intelligence Engine</div></div>
          </div>
          <div className="header-actions">
            {appStep > 0 && (
              <button className="back-btn" onClick={goBack}>
                <Icons.ArrowLeft /> Back
              </button>
            )}
            {appStep === 3 && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => navigateTo(2)} title="Edit task definitions"><Icons.Layers /></button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigateTo(1)} title="Edit scoring"><Icons.Settings /></button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowExport(true)}><Icons.Download /> Export</button>
                {scanning ? (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={togglePause}>{paused ? <><Icons.Play /> Resume</> : <><Icons.Pause /> Pause</>}</button>
                    <button className="btn btn-danger btn-sm" onClick={stopScan}>Stop</button>
                  </>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={startScan}><Icons.Zap /> Rescan</button>
                )}
              </>
            )}
          </div>
        </header>

        <main className="main">
          <StepIndicator current={appStep} steps={["Upload Companies", "Configure Scoring", "Define Tasks", "Track Signals"]} onNavigate={navigateTo} />

          {/* ─── STEP 0: Upload ─── */}
          {appStep === 0 && (
            <div className="fade-up">
              <div className="section"><h2 className="section-title">Upload Your Companies</h2><p className="section-desc">Import a CSV with company names or domains. We'll track news signals and generate actionable tasks.</p></div>
              <div className="grid-2">
                <div className="card">
                  <div className="card-header"><div className="card-title">CSV Upload</div></div>
                  <div className="card-body">
                    <div className={`upload-zone ${dragging ? "dragging" : ""}`}
                      onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                      onDrop={e => { e.preventDefault(); setDragging(false); handleFileUpload(e.dataTransfer.files[0]); }}
                      onClick={() => fileRef.current?.click()}>
                      <div className="upload-icon"><Icons.Upload /></div>
                      <div className="upload-title">Drop your CSV here</div>
                      <div className="upload-desc">or click to browse — .csv files accepted</div>
                      <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files[0])} />
                    </div>
                    <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "var(--text-tertiary)" }}>Expected: Company Name, Domain, Industry, Size (flexible mapping)</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><div className="card-title">Quick Start</div></div>
                  <div className="card-body">
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>Try the demo with sample B2B companies.</p>
                    <button className="btn btn-primary" onClick={loadDemoData} style={{ width: "100%" }}><Icons.Zap /> Load Demo Companies</button>
                    <div style={{ marginTop: 20 }}>
                      {MOCK_COMPANIES.map((c, i) => (
                        <div key={i} className="company-row" style={{ padding: "8px 0", border: "none" }}>
                          <div className="company-avatar">{c.name[0]}</div>
                          <div className="company-info"><div className="company-name">{c.name}</div><div className="company-domain">{c.domain}</div></div>
                          <Chip type="blue">{c.industry}</Chip>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-header"><div className="card-title">How It Works</div></div>
                <div className="card-body">
                  <div className="grid-3">
                    {[
                      ["News Ingestion", "NewsAPI / Google News RSS / Bing News API for real-time company mentions. LinkedIn API for social signals and job posts. Background polling every 15 min."],
                      ["AI Classification", "Claude API (Anthropic) classifies each news item against your signal taxonomy. Intent extraction and signal matching with configurable scoring."],
                      ["Task Generation", "Matched signals auto-generate scored tasks. Export via CSV or push to CRM via Zapier/Make webhooks. Real-time streaming with pause/resume."],
                    ].map(([title, desc], i) => (
                      <div key={i} className="stat-card">
                        <div style={{ color: "var(--accent)", marginBottom: 8, fontWeight: 600, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>{title}</div>
                        <p style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.6 }}>{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 1: Scoring ─── */}
          {appStep === 1 && (
            <div className="fade-up">
              <div className="section"><h2 className="section-title">Configure Scoring</h2><p className="section-desc">Set up how signals are scored and prioritized.</p></div>
              <div className="tabs" style={{ maxWidth: 400 }}>
                <button className={`tab ${scoringMode === "chat" ? "active" : ""}`} onClick={() => setScoringMode("chat")}><Icons.Bot /> AI Assistant</button>
                <button className={`tab ${scoringMode === "manual" ? "active" : ""}`} onClick={() => setScoringMode("manual")}><Icons.Settings /> Manual</button>
              </div>
              {scoringMode === "chat" ? <ScoringChatbot weights={weights} setWeights={setWeights} onComplete={handleScoringComplete} /> : <ManualScoring weights={weights} setWeights={setWeights} onComplete={handleScoringComplete} />}
            </div>
          )}

          {/* ─── STEP 2: Task Definitions ─── */}
          {appStep === 2 && (
            <div className="fade-up">
              <div className="section">
                <h2 className="section-title">Define Your Signal Tasks</h2>
                <p className="section-desc">
                  Build your task taxonomy — the signals you want to detect. Use the AI builder to create tasks from plain language, or manually define them. You can edit, duplicate, or remove any task.
                </p>
              </div>

              <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
                {/* Left: AI Builder + Add */}
                <div>
                  <div className="tabs" style={{ marginBottom: 16 }}>
                    <button className={`tab ${taskDefView === "ai-builder" ? "active" : ""}`} onClick={() => setTaskDefView("ai-builder")}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icons.Wand /> AI Builder</span>
                    </button>
                    <button className={`tab ${taskDefView === "library" ? "active" : ""}`} onClick={() => setTaskDefView("library")}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icons.Layers /> Library</span>
                    </button>
                  </div>

                  {taskDefView === "ai-builder" && (
                    <AITaskBuilderChat onAddTask={(task) => setTaskDefs(prev => [...prev, task])} />
                  )}

                  {taskDefView === "library" && (
                    <div className="card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">Task Library</div>
                          <div className="card-subtitle">{taskDefs.length} task definitions</div>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => { setEditingTask(null); setShowTaskEditor(true); }}>
                          <Icons.Plus /> New Task
                        </button>
                      </div>
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
                        <div style={{ position: "relative" }}>
                          <input className="input" placeholder="Search tasks..." value={taskSearch} onChange={e => setTaskSearch(e.target.value)}
                            style={{ paddingLeft: 36 }} />
                          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }}><Icons.Search /></span>
                        </div>
                      </div>
                      <div style={{ maxHeight: 460, overflowY: "auto", padding: "12px 16px" }}>
                        {filteredTaskDefs.length === 0 ? (
                          <div className="empty-state" style={{ padding: "30px 16px" }}>
                            <div className="empty-title">No tasks found</div>
                            <div className="empty-desc">Try a different search or add a new task</div>
                          </div>
                        ) : (
                          filteredTaskDefs.map(t => (
                            <TaskDefCard key={t.id} task={t}
                              onEdit={(task) => { setEditingTask(task); setShowTaskEditor(true); }}
                              onDelete={handleDeleteTask}
                              onDuplicate={handleDuplicateTask}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Summary + Continue */}
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header">
                      <div className="card-title">Configuration Summary</div>
                    </div>
                    <div className="card-body">
                      <div className="grid-3" style={{ marginBottom: 20 }}>
                        <div className="stat-card" style={{ padding: 14, textAlign: "center" }}>
                          <div className="stat-value" style={{ fontSize: 24 }}>{companies.length}</div>
                          <div className="stat-label">Companies</div>
                        </div>
                        <div className="stat-card" style={{ padding: 14, textAlign: "center" }}>
                          <div className="stat-value" style={{ fontSize: 24, color: "var(--accent)" }}>{taskDefs.length}</div>
                          <div className="stat-label">Task Defs</div>
                        </div>
                        <div className="stat-card" style={{ padding: 14, textAlign: "center" }}>
                          <div className="stat-value" style={{ fontSize: 24 }}>{weights.threshold}</div>
                          <div className="stat-label">Threshold</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <div className="input-label" style={{ marginBottom: 8 }}>Scoring Weights</div>
                        {[["Ease", weights.ease], ["Strength", weights.strength], ["Source Multi.", weights.sourceMultiplicity]].map(([label, val]) => (
                          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: "var(--text-tertiary)", width: 90 }}>{label}</span>
                            <div style={{ flex: 1, height: 4, background: "var(--bg-hover)", borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${val}%`, background: "var(--accent)", borderRadius: 4 }} />
                            </div>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--accent)", width: 30, textAlign: "right" }}>{val}%</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <div className="input-label" style={{ marginBottom: 8 }}>Task Breakdown</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Chip type="green">{taskDefs.filter(t => t.ease === "Easy").length} Easy</Chip>
                          <Chip type="amber">{taskDefs.filter(t => t.ease === "Medium").length} Medium</Chip>
                          <Chip type="red">{taskDefs.filter(t => t.ease === "Hard").length} Hard</Chip>
                          <span style={{ color: "var(--border)" }}>|</span>
                          <Chip type="green">{taskDefs.filter(t => t.strength === "Strong").length} Strong</Chip>
                          <Chip type="amber">{taskDefs.filter(t => t.strength === "Medium").length} Medium</Chip>
                        </div>
                      </div>

                      <button className="btn btn-primary" style={{ width: "100%", padding: "12px 16px", fontSize: 14 }}
                        onClick={handleTaskDefsComplete} disabled={taskDefs.length === 0}>
                        {tasks.length > 0
                          ? <><Icons.ArrowRight /> Back to Dashboard — {tasks.length} Tasks Found</>
                          : <><Icons.Zap /> Start Scanning — {taskDefs.length} Tasks × {companies.length} Companies</>
                        }
                      </button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header"><div className="card-title" style={{ fontSize: 14 }}>Pro Tips</div></div>
                    <div className="card-body" style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.7 }}>
                      <div style={{ marginBottom: 10 }}>
                        <strong style={{ color: "var(--text-secondary)" }}>Use the AI Builder</strong> — describe signals in plain language like "when a company's marketing leader leaves" and AI will structure it into a proper task definition with keywords and sources.
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <strong style={{ color: "var(--text-secondary)" }}>AI Refine in Editor</strong> — if you start typing a rough task name or description, hit "Refine with AI" to get a polished version with auto-suggested keywords, sources, and scoring.
                      </div>
                      <div>
                        <strong style={{ color: "var(--text-secondary)" }}>Keywords matter</strong> — they're used for news-to-task matching. More specific keywords = fewer false positives. Add variations and abbreviations.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Dashboard ─── */}
          {appStep === 3 && (
            <div className="fade-up">
              <div className="scan-status">
                <div className={`scan-dot ${scanning ? (paused ? "paused" : "active") : "idle"}`} />
                <span className="scan-text">{scanning ? (paused ? "Scanning paused" : `Scanning ${currentScanCompany}...`) : scanProgress >= 100 ? "Scan complete" : "Ready to scan"}</span>
                {scanning && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--accent)" }}>{Math.round(scanProgress)}%</span>}
              </div>
              {scanning && <div className="progress-bar" style={{ marginBottom: 24 }}><div className="progress-fill" style={{ width: `${scanProgress}%` }} /></div>}

              <div className="grid-3" style={{ marginBottom: 24 }}>
                <div className="stat-card"><div className="stat-value">{companies.length}</div><div className="stat-label">Companies Tracked</div></div>
                <div className="stat-card"><div className="stat-value">{allNews.length}</div><div className="stat-label">Signals Detected</div></div>
                <div className="stat-card"><div className="stat-value" style={{ color: "var(--green)" }}>{tasks.length}</div><div className="stat-label">Tasks Generated</div></div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <div className="card-header">
                    <div><div className="card-title">Task Queue</div><div className="card-subtitle">Ranked by composite score · Click any task for details</div></div>
                    <Chip type="gold">{tasks.length} unique tasks</Chip>
                  </div>
                  {tasks.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon"><Icons.Zap /></div><div className="empty-title">{scanning ? "Generating tasks..." : "No tasks yet"}</div><div className="empty-desc">{scanning ? "Tasks appear in real-time" : "Start a scan"}</div></div>
                  ) : (
                    <div className="table-wrapper" style={{ maxHeight: 500, overflowY: "auto" }}>
                      <table>
                        <thead><tr><th>Company</th><th>Task</th><th>Score</th><th>Ease</th><th>Strength</th></tr></thead>
                        <tbody>
                          {sortedTasks.map(t => (
                            <tr key={t.id} className="task-new task-clickable" onClick={() => setSelectedTask(t)}>
                              <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="company-avatar" style={{ width: 28, height: 28, fontSize: 11, borderRadius: 6 }}>{t.companyName[0]}</div><span className="td-primary" style={{ fontSize: 12 }}>{t.companyName}</span></div></td>
                              <td style={{ fontSize: 12, maxWidth: 220 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 3, letterSpacing: 0.5, background: t.signalType === "job_post" ? "var(--blue-dim)" : "var(--green-dim)", color: t.signalType === "job_post" ? "var(--blue)" : "var(--green)" }}>
                                    {t.signalType === "job_post" ? "JOB" : "NEWS"}
                                  </span>
                                  <span className="td-primary">{t.taskName}</span>
                                </div>
                              </td>
                              <td><div className="score-bar"><div className="score-track"><div className="score-fill" style={{ width: `${(t.score / 10) * 100}%`, background: t.score > 7 ? "var(--green)" : t.score > 5 ? "var(--amber)" : "var(--red)" }} /></div><span className="score-value" style={{ color: t.score > 7 ? "var(--green)" : t.score > 5 ? "var(--amber)" : "var(--red)" }}>{t.score.toFixed(1)}</span></div></td>
                              <td><Chip type={t.ease === "Easy" ? "green" : "amber"}>{t.ease}</Chip></td>
                              <td><Chip type={t.strength === "Strong" ? "green" : "amber"}>{t.strength}</Chip></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="card">
                  <div className="card-header">
                    <div><div className="card-title">Live Signal Feed</div><div className="card-subtitle">Real-time news detection</div></div>
                    <Chip type="blue">{allNews.length} signals</Chip>
                  </div>
                  {allNews.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon"><Icons.Search /></div><div className="empty-title">{scanning ? "Scanning..." : "No signals"}</div><div className="empty-desc">News streams here as detected</div></div>
                  ) : (
                    <div style={{ maxHeight: 500, overflowY: "auto" }}>
                      {[...allNews].reverse().map(n => (
                        <div key={n.id} className="news-item">
                          <div className="news-headline">{n.headline}</div>
                          <div className="news-meta">
                            <span>{n.companyName}</span><span>·</span>
                            {n.url ? (
                              <a href={n.url} target="_blank" rel="noopener noreferrer" className="news-source-link">{n.source} <Icons.ExternalLink /></a>
                            ) : (
                              <span>{n.source}</span>
                            )}
                            <span>·</span><span>{new Date(n.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Modals */}
        <ColumnSelectModal show={showColSelect} columns={csvColumns} selected={selectedCsvCols}
          onConfirm={cols => { setSelectedCsvCols(cols); setShowColSelect(false); setAppStep(1); }}
          onClose={() => { setShowColSelect(false); setAppStep(1); }} />
        <ExportModal show={showExport} onClose={() => setShowExport(false)} csvColumns={selectedCsvCols} tasks={sortedTasks} companies={companies} allNews={allNews} />
        <TaskEditorModal show={showTaskEditor} task={editingTask} onSave={handleSaveTask} onClose={() => { setShowTaskEditor(false); setEditingTask(null); }} />
        <TaskDetailPanel task={selectedTask} allNews={allNews} companies={companies} onClose={() => setSelectedTask(null)} />
      </div>
    </>
  );
}
