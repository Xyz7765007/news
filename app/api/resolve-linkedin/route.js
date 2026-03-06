import { NextResponse } from "next/server";

/**
 * Resolves LinkedIn company slugs to numeric company IDs.
 * 
 * Input:  { slugs: ["meta", "sprinto", "freshworks"] }
 * Output: { ids: { "meta": "10667", "sprinto": "87654" }, failed: ["unknown-co"] }
 * 
 * Uses Apify company scraper. Batches to avoid timeouts.
 * The numeric ID is needed for f_C parameter in LinkedIn job search URLs.
 */

const BATCH_SIZE = 10; // Process 10 companies at a time to avoid timeouts

export async function POST(request) {
  try {
    const { slugs } = await request.json();
    if (!slugs?.length) return NextResponse.json({ error: "No slugs provided" }, { status: 400 });

    const token = process.env.APIFY_TOKEN;
    if (!token) return NextResponse.json({ error: "APIFY_TOKEN not configured" }, { status: 500 });

    console.log(`\n── Resolving ${slugs.length} LinkedIn company IDs ──`);

    const actorId = process.env.APIFY_COMPANY_ACTOR_ID || "apimaestro/linkedin-company-detail";
    const apiActorId = actorId.replace("/", "~");
    console.log(`  Actor: ${actorId}`);

    const allIds = {};
    const allFailed = [];

    // Process in batches to avoid timeouts
    for (let i = 0; i < slugs.length; i += BATCH_SIZE) {
      const batch = slugs.slice(i, i + BATCH_SIZE);
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.join(", ")}`);

      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 45000);

        const res = await fetch(
          `https://api.apify.com/v2/acts/${apiActorId}/run-sync-get-dataset-items?token=${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: batch }),
            signal: ctrl.signal,
          }
        );
        clearTimeout(timeout);

        if (!res.ok) {
          const err = await res.text();
          console.error(`  Batch failed HTTP ${res.status}: ${err.slice(0, 200)}`);
          allFailed.push(...batch);
          continue;
        }

        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        console.log(`  Batch returned ${items.length} items`);

        // Log first item's full structure for debugging (only once)
        if (i === 0 && items.length > 0) {
          console.log(`  First item keys: ${Object.keys(items[0]).join(", ")}`);
          console.log(`  First item sample: ${JSON.stringify(items[0]).slice(0, 600)}`);
        }

        // Extract IDs from results
        for (const item of items) {
          const slug = findSlug(item, batch);
          const numericId = findNumericId(item);

          if (slug && numericId) {
            allIds[slug.toLowerCase()] = String(numericId);
            console.log(`  ✓ ${slug} → ${numericId}`);
          } else {
            console.log(`  ✗ Could not map: slug=${slug}, id=${numericId}`);
          }
        }
      } catch (e) {
        console.error(`  Batch error: ${e.name === "AbortError" ? "Timed out (45s)" : e.message}`);
        allFailed.push(...batch);
      }
    }

    // Check which slugs weren't found
    for (const slug of slugs) {
      if (!allIds[slug.toLowerCase()] && !allFailed.includes(slug)) {
        allFailed.push(slug);
      }
    }

    console.log(`  DONE: Resolved ${Object.keys(allIds).length}/${slugs.length} | Failed: ${allFailed.length}`);
    return NextResponse.json({ ids: allIds, failed: allFailed });
  } catch (e) {
    console.error("Resolve error:", e.message);
    return NextResponse.json({ ids: {}, failed: [], error: e.message });
  }
}

/**
 * Find the slug in an Apify response item.
 * Different actors return the slug in different fields — try them all.
 */
function findSlug(item, inputBatch) {
  // BEST: input_identifier is literally the slug we sent to Apify
  if (item.input_identifier) return item.input_identifier.toLowerCase();

  // Nested basic_info (apimaestro actor)
  const bi = item.basic_info || {};
  const directSlug = bi.universal_name || bi.universalName || item.universalName || item.slug || item.companySlug || item.vanityName || item.username;
  if (directSlug) return directSlug.toLowerCase();

  // Extract from LinkedIn URLs
  const urlFields = [
    item.url, item.linkedinUrl, item.companyUrl, item.linkedinCompanyUrl,
    item.profileUrl, item.link, item.href, item.companyLinkedinUrl,
    ...(item.links || []).map(l => l.url || l.href || "")
  ];
  for (const u of urlFields) {
    const slug = extractSlugFromUrl(u);
    if (slug) return slug;
  }

  // Match company name to input batch
  const name = (bi.name || item.name || item.companyName || item.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (name) {
    const match = inputBatch.find(s => s.toLowerCase().replace(/[^a-z0-9]/g, "") === name);
    if (match) return match.toLowerCase();
    const fuzzy = inputBatch.find(s => name.includes(s.toLowerCase().replace(/-/g, "")));
    if (fuzzy) return fuzzy.toLowerCase();
  }

  return null;
}

/**
 * Find the numeric LinkedIn company ID in an Apify response item.
 * Different actors store it in different fields — try them all.
 */
function findNumericId(item) {
  // Explicit ID fields (top level)
  const idFields = [
    item.companyId, item.company_id, item.linkedinId, item.linkedin_id,
    item.numericId, item.organizationId, item.internalId
  ];
  for (const val of idFields) {
    const id = extractNumeric(val);
    if (id) return id;
  }

  // company_urn field (apimaestro actor): "urn:li:company:3650994"
  const urn = item.company_urn || item.entityUrn || item.urn || item.companyUrn || "";
  const urnMatch = String(urn).match(/(\d{3,15})$/);
  if (urnMatch) return urnMatch[1];

  // Nested basic_info (apimaestro actor)
  const bi = item.basic_info || {};
  const biId = extractNumeric(bi.companyId || bi.company_id || bi.id);
  if (biId) return biId;
  const biUrn = bi.company_urn || bi.entityUrn || bi.urn || "";
  const biUrnMatch = String(biUrn).match(/(\d{3,15})$/);
  if (biUrnMatch) return biUrnMatch[1];

  // Stats might have it (apimaestro actor)
  const stats = item.stats || {};
  const staffUrn = stats.staffCountRange?.start;
  // Not the right field — check for ID in stats
  
  // Extract from URLs containing f_C or numeric company path
  const urlFields = [
    item.jobsUrl, item.companyJobsUrl, item.jobSearchUrl,
    item.url, item.linkedinUrl, item.companyUrl
  ];
  for (const u of urlFields) {
    if (!u) continue;
    const fc = String(u).match(/f_C=(\d+)/);
    if (fc) return fc[1];
    const numPath = String(u).match(/linkedin\.com\/company\/(\d{3,15})/);
    if (numPath) return numPath[1];
  }

  // Check nested objects
  const nested = [item.details, item.companyData, item.data, item.metadata];
  for (const obj of nested) {
    if (obj && typeof obj === "object") {
      const id = extractNumeric(obj.companyId || obj.id || obj.linkedinId);
      if (id) return id;
    }
  }

  // Last resort: scan all fields for ID-like values
  for (const [key, val] of Object.entries(item)) {
    const keyLower = key.toLowerCase();
    if (keyLower.includes("id") || keyLower.includes("company")) {
      if (typeof val === "number" && val >= 1000 && val <= 999999999999) return String(val);
      if (typeof val === "string" && /^\d{3,15}$/.test(val)) return val;
    }
  }

  return null;
}

function extractSlugFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  const m = url.match(/linkedin\.com\/company\/([^\/?\s&#]+)/i);
  if (m && !/^\d+$/.test(m[1])) return m[1].toLowerCase();
  return null;
}

function extractNumeric(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (/^\d{3,15}$/.test(str)) return str;
  return null;
}
