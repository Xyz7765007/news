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
  { id: "t1", name: "New CMO/CGO appointment", description: "A company appoints a new Chief Marketing Officer or Chief Growth Officer, signaling strategic marketing shifts.", ease: "Easy", strength: "Strong", sources: ["New Hires", "News", "Job Posts"], keywords: ["CMO", "CGO", "chief marketing", "chief growth"] },
  { id: "t2", name: "Hiring global MMM / effectiveness lead", description: "Company is hiring for marketing mix modeling or marketing effectiveness leadership roles.", ease: "Easy", strength: "Strong", sources: ["New Hires", "News", "Job Posts"], keywords: ["MMM", "marketing effectiveness", "marketing mix"] },
  { id: "t3", name: "New transformation / AI marketing role", description: "Company creates a new role focused on AI-driven marketing transformation.", ease: "Easy", strength: "Strong", sources: ["New Hires", "News", "Job Posts"], keywords: ["AI marketing", "marketing transformation", "digital transformation"] },
  { id: "t4", name: "Major competitor brand repositioning", description: "A major competitor undergoes brand repositioning, creating urgency and opportunity.", ease: "Easy", strength: "Strong", sources: ["News"], keywords: ["rebrand", "repositioning", "brand overhaul"] },
  { id: "t5", name: "Regulatory change affecting data use", description: "New regulations impacting data collection, privacy, or usage in marketing.", ease: "Easy", strength: "Strong", sources: ["News"], keywords: ["regulation", "data privacy", "GDPR", "compliance"] },
  { id: "t6", name: "New non-traditional entrants", description: "Non-traditional players entering the market, disrupting established competitive dynamics.", ease: "Easy", strength: "Strong", sources: ["News"], keywords: ["new entrant", "disruption", "market entry"] },
  { id: "t7", name: "Executive speaking on effectiveness topic", description: "C-suite executive publicly discusses marketing effectiveness, measurement, or ROI.", ease: "Easy", strength: "Medium", sources: ["News", "Social"], keywords: ["effectiveness", "keynote", "conference", "speaking"] },
  { id: "t8", name: "Interim CMO role created", description: "Company creates an interim CMO position, indicating leadership transition or instability.", ease: "Medium", strength: "Strong", sources: ["New Hires", "News", "Social"], keywords: ["interim CMO", "acting CMO", "leadership transition"] },
  { id: "t9", name: "Agency review or consolidation", description: "Company initiates review of agency relationships or consolidates agency roster.", ease: "Medium", strength: "Strong", sources: ["News"], keywords: ["agency review", "pitch", "consolidation", "RFP"] },
  { id: "t10", name: "Exec publicly reframes success metrics", description: "Executive publicly shifts how the company measures marketing or business success.", ease: "Medium", strength: "Medium", sources: ["News", "Social"], keywords: ["success metrics", "KPI", "measurement", "reframe"] },
  { id: "t11", name: "Category growth stalls or polarises", description: "Overall category growth slows or becomes polarized between winners and losers.", ease: "Medium", strength: "Strong", sources: ["News", "Custom"], keywords: ["growth stall", "market slowdown", "polarization"] },
  { id: "t12", name: "Analyst questions marketing ROI publicly", description: "Industry analyst publicly questions a company's marketing ROI or spend efficiency.", ease: "Medium", strength: "Strong", sources: ["News"], keywords: ["analyst", "marketing ROI", "spend efficiency", "downgrade"] },
  { id: "t13", name: "Emerging markets outperform core", description: "Company's emerging market segments outperform established core markets.", ease: "Medium", strength: "Medium", sources: ["News"], keywords: ["emerging market", "outperform", "growth market"] },
  { id: "t14", name: "Senior marketer exits within 12 months", description: "A senior marketing leader departs within their first year, signaling internal challenges.", ease: "Easy", strength: "Strong", sources: ["Exits / Promotions"], keywords: ["departure", "exit", "leaves", "steps down"] },
  { id: "t15", name: "Earnings call focus shifts to CAC / efficiency", description: "Company's earnings call narrative pivots toward customer acquisition cost and efficiency.", ease: "Easy", strength: "Strong", sources: ["Custom"], keywords: ["earnings", "CAC", "efficiency", "cost reduction"] },
  { id: "t16", name: "Repeated backfilling of analytics roles", description: "Company repeatedly hiring for the same analytics positions, indicating retention issues.", ease: "Medium", strength: "Medium", sources: ["Exits / Promotions", "Job Posts"], keywords: ["analytics", "backfill", "data analyst", "repeated hiring"] },
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
