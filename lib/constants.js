// ─── Scoring Constants ────────────────────────────────────────────
export const EASE_SCORE = { Easy: 3, Medium: 2, Hard: 1 };
export const STRENGTH_SCORE = { Strong: 3, Medium: 2, Weak: 1 };

export const SOURCE_OPTIONS = [
  "News",
  "New Hires",
  "Job Posts",
  "Social",
  "Exits / Promotions",
  "Custom",
  "Earnings",
  "SEC Filings",
];

export const DEFAULT_SIGNAL_TASKS = [
  { id: "t1", name: "New CMO/CGO appointment", description: "New Chief Marketing Officer and Chief Growth Officers hires or openings at the target accounts.", ease: "Easy", strength: "Strong", sources: ["News", "Job Posts", "New Hires"], keywords: ["CMO", "CGO", "chief marketing officer", "chief growth officer", "CMO appointment", "CMO hire", "new CMO", "head of marketing appointed"] },
  { id: "t2", name: "Hiring global MMM / effectiveness lead", description: "New hires or openings in Marketing Mix Modeling and Effectiveness roles. Look for these keywords in the job title - Marketing Modeling, Media modeling, MMM, Econometrics, Attribution, Effectiveness, Marketing Science, Incrementality, Marketing Analytics, Causal Measurement.", ease: "Easy", strength: "Strong", sources: ["News", "Job Posts", "New Hires"], keywords: ["Marketing Modeling", "Media modeling", "MMM", "Econometrics", "Attribution", "Effectiveness", "Marketing Science", "Incrementality", "Marketing Analytics", "Causal Measurement", "marketing mix modeling", "marketing effectiveness lead"] },
  { id: "t3", name: "New transformation / AI marketing role", description: "New hires or openings in Marketing Transformation and AI Marketing roles. Look for these keywords in job title - Marketing Transformation, Marketing AI, AI-Powered Marketing, MarTech, Marketing Automation, Customer Data Platform, Marketing Operations, Personalization Strategy, Growth Marketing, Digital Marketing Strategy.", ease: "Easy", strength: "Strong", sources: ["News", "Job Posts", "New Hires"], keywords: ["Marketing Transformation", "Marketing AI", "AI-Powered Marketing", "MarTech", "Marketing Automation", "Customer Data Platform", "Marketing Operations", "Personalization Strategy", "Growth Marketing", "Digital Marketing Strategy"] },
  { id: "t4", name: "Major competitor brand repositioning", description: "One of their top competitors is undergoing a major brand repositioning (new positioning, identity, or messaging shift), creating potential need for refreshed insights, strategic validation, and competitive response support.", ease: "Easy", strength: "Strong", sources: ["News"], keywords: ["rebrand", "repositioning", "brand overhaul", "brand refresh", "new positioning", "identity shift", "messaging shift", "competitive response", "brand strategy"] },
  { id: "t5", name: "Regulatory change affecting data use", description: "Regulatory changes impacting data collection, usage, targeting, or measurement practices — potential trigger for reassessing insights approaches, compliance strategy, and marketing effectiveness frameworks.", ease: "Easy", strength: "Strong", sources: ["News"], keywords: ["regulation", "data privacy", "GDPR", "compliance", "data collection", "targeting regulation", "measurement regulation", "privacy law", "cookie deprecation", "consent management"] },
  { id: "t6", name: "New non-traditional entrants", description: "Emergence of non-traditional or disruptive entrants gaining traction and threatening market share — potential trigger for refreshed competitive insights, segmentation reassessment, and strategic repositioning support.", ease: "Easy", strength: "Strong", sources: ["News"], keywords: ["new entrant", "disruption", "market entry", "disruptive entrant", "market share threat", "non-traditional competitor", "competitive disruption"] },
  { id: "t7", name: "Executive speaking on effectiveness topic", description: "Senior executive publicly speaking on marketing effectiveness, measurement, or ROI — potential signal of strategic priority and opportunity to support effectiveness frameworks, insights validation, or performance optimization.", ease: "Easy", strength: "Medium", sources: ["News", "Social"], keywords: ["effectiveness", "keynote", "conference", "speaking", "marketing ROI", "measurement", "performance optimization", "marketing effectiveness", "summit", "panel"] },
  { id: "t8", name: "Interim CMO role created", description: "Interim Chief Marketing Officer appointed or interim CMO role created — potential signal of strategic reset, transformation mandate, or openness to external insights and effectiveness support.", ease: "Medium", strength: "Strong", sources: ["News", "Job Posts", "Social"], keywords: ["interim CMO", "acting CMO", "leadership transition", "interim chief marketing", "CMO transition", "marketing leadership change", "strategic reset"] },
  { id: "t9", name: "Agency review or consolidation", description: "Agency review, pitch, or consolidation involving creative, media, digital, or MarTech partners — potential trigger for independent measurement validation, effectiveness benchmarking, and strategic insights support during transition.", ease: "Medium", strength: "Strong", sources: ["News"], keywords: ["agency review", "pitch", "consolidation", "RFP", "agency pitch", "media review", "creative review", "agency roster", "MarTech partner review", "effectiveness benchmarking"] },
  { id: "t10", name: "Exec publicly reframes success metrics", description: "Executive publicly reframes marketing success metrics (e.g., shifting from growth to profitability, brand to performance, or reach to ROI) — potential trigger for updated measurement frameworks, KPI alignment, and insights recalibration.", ease: "Medium", strength: "Medium", sources: ["News", "Social"], keywords: ["success metrics", "KPI", "measurement", "reframe", "profitability shift", "brand to performance", "ROI focus", "metrics recalibration", "KPI alignment"] },
  { id: "t11", name: "Category growth stalls or polarises", description: "Category growth stalls, declines, or polarizes (premium vs. value divergence) — potential trigger for segmentation refresh, demand diagnostics, portfolio strategy reassessment, and growth opportunity identification.", ease: "Medium", strength: "Strong", sources: ["News", "Custom"], keywords: ["growth stall", "market slowdown", "polarization", "category decline", "premium vs value", "demand diagnostics", "portfolio reassessment", "market contraction", "segmentation refresh"] },
  { id: "t12", name: "Analyst questions marketing ROI publicly", description: "Industry or financial analyst publicly questions marketing ROI or spend effectiveness — potential trigger for independent effectiveness validation, ROI modeling reinforcement, and executive-ready evidence to defend or recalibrate investment.", ease: "Medium", strength: "Strong", sources: ["News"], keywords: ["analyst", "marketing ROI", "spend efficiency", "downgrade", "spend effectiveness", "ROI questioned", "marketing investment", "cost scrutiny", "budget justification"] },
  { id: "t13", name: "Emerging markets outperform core", description: "Emerging markets significantly outperform core markets — potential trigger for resource reallocation analysis, localization insights, demand driver diagnostics, and scalable growth strategy validation.", ease: "Medium", strength: "Medium", sources: ["News", "Earnings"], keywords: ["emerging market", "outperform", "growth market", "resource reallocation", "localization", "demand drivers", "international expansion", "market outperformance"] },
  { id: "t14", name: "Senior marketer exits within 12 months", description: "Senior marketing leader exits within 12 months — potential signal of strategic instability or performance pressure, creating opportunity for independent insights, effectiveness reset, and continuity support during transition.", ease: "Easy", strength: "Strong", sources: ["Exits / Promotions"], keywords: ["departure", "exit", "leaves", "steps down", "marketing leader exit", "CMO departure", "VP marketing leaves", "head of marketing exits", "resignation"] },
  { id: "t15", name: "Earnings call focus shifts to CAC / efficiency", description: "Earnings call shifts focus to CAC, efficiency, or cost discipline — potential trigger for deeper effectiveness diagnostics, spend optimization, ROI validation, and performance-to-growth rebalancing support.", ease: "Easy", strength: "Strong", sources: ["Earnings", "Custom"], keywords: ["earnings", "CAC", "efficiency", "cost reduction", "cost discipline", "spend optimization", "customer acquisition cost", "earnings call", "profitability focus", "margin improvement"] },
  { id: "t16", name: "Repeated backfilling of analytics roles", description: "Repeated backfilling of analytics or insights roles — potential signal of capability gaps or delivery strain, creating opportunity for external expertise, methodological rigor, and scalable effectiveness support.", ease: "Medium", strength: "Medium", sources: ["Job Posts", "Exits / Promotions"], keywords: ["analytics", "backfill", "data analyst", "repeated hiring", "insights role", "analytics vacancy", "capability gap", "analytics backfill", "marketing analyst"] },
];

export const DEMO_COMPANIES = [
  { domain: "sprinto.com", name: "Sprinto", industry: "SaaS / Compliance", size: "200-500" },
  { domain: "tazapay.com", name: "Tazapay", industry: "FinTech / Payments", size: "50-200" },
  { domain: "e6data.com", name: "e6data", industry: "Data / Analytics", size: "50-200" },
  { domain: "freshworks.com", name: "Freshworks", industry: "SaaS / CRM", size: "5000+" },
  { domain: "razorpay.com", name: "Razorpay", industry: "FinTech / Payments", size: "3000+" },
];

// ─── Utility Functions ────────────────────────────────────────────

export const uid = () => Math.random().toString(36).slice(2, 10);

export function scoreTask(task, weights) {
  const ease = EASE_SCORE[task.ease] || 1;
  const strength = STRENGTH_SCORE[task.strength] || 1;
  const sourceCount = (task.sources || []).length;
  const sourceBonus = Math.min(sourceCount, 4);

  const easeNorm = (ease / 3) * 10;
  const strengthNorm = (strength / 3) * 10;
  const sourceNorm = (sourceBonus / 4) * 10;

  const totalWeight =
    weights.ease + weights.strength + weights.sourceMultiplicity;
  if (totalWeight === 0) return 5;

  return (
    (easeNorm * weights.ease +
      strengthNorm * weights.strength +
      sourceNorm * weights.sourceMultiplicity) /
    totalWeight
  );
}

export function parseCSV(text) {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));

  const nameCol = headers.findIndex((h) =>
    /^(company|name|company.?name)/i.test(h)
  );
  const domainCol = headers.findIndex((h) =>
    /^(domain|website|url)/i.test(h)
  );
  const industryCol = headers.findIndex((h) =>
    /^(industry|sector|vertical)/i.test(h)
  );
  const sizeCol = headers.findIndex((h) =>
    /^(size|employees|company.?size)/i.test(h)
  );

  const rows = lines
    .slice(1)
    .map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        name: nameCol >= 0 ? cols[nameCol] : cols[0],
        domain:
          domainCol >= 0
            ? cols[domainCol]
            : cols[1] ||
              `${(cols[0] || "").toLowerCase().replace(/\s/g, "")}.com`,
        industry: industryCol >= 0 ? cols[industryCol] : "—",
        size: sizeCol >= 0 ? cols[sizeCol] : "—",
      };
    })
    .filter((c) => c.name);

  return { headers, rows };
}

export function exportTasksCSV(tasks, companies, allNews, selectedCols) {
  const allCols = [
    { key: "company", label: "Company Name" },
    { key: "domain", label: "Domain" },
    { key: "industry", label: "Industry" },
    { key: "size", label: "Company Size" },
    { key: "task", label: "Task Name" },
    { key: "score", label: "Score" },
    { key: "ease", label: "Ease" },
    { key: "strength", label: "Strength" },
    { key: "sources", label: "Signal Sources" },
    { key: "newsHeadline", label: "News Headline" },
    { key: "newsSource", label: "News Source" },
    { key: "newsDate", label: "News Date" },
  ];

  const headerRow = selectedCols
    .map((k) => allCols.find((c) => c.key === k)?.label || k)
    .join(",");

  const dataRows = tasks.map((t) => {
    const company = companies.find((c) => c.domain === t.companyDomain) || {};
    const news = allNews.find((n) => n.id === t.newsId) || {};
    const row = selectedCols.map((k) => {
      const map = {
        company: company.name,
        domain: company.domain,
        industry: company.industry,
        size: company.size,
        task: t.taskName,
        score: t.score?.toFixed(2),
        ease: t.ease,
        strength: t.strength,
        sources: (t.sources || []).join("; "),
        newsHeadline: news.headline,
        newsSource: news.source,
        newsDate: news.date
          ? new Date(news.date).toLocaleDateString()
          : "",
      };
      return map[k] || "";
    });
    return row
      .map((v) => `"${String(v || "").replace(/"/g, '""')}"`)
      .join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}
