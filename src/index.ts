/***********************************************************************
 * Enhanced IATI MCP agent                                             *
 *  - Dynamic codelist cache (Country, Sector, ActivityStatus)         *
 *  - Smart query builder for Datastore v3                             *
 *  - Facet & pagination support                                       *
 **********************************************************************/

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type CodelistItem = { code: string; name: string };
type QueryArgs = Record<string, string | number | undefined>;

const DS_BASE = "https://api.iatistandard.org/datastore";
const CL_BASE =
  "https://iatistandard.org/reference_downloads/203/codelists/downloads/clv3/json/en";

/* ---------- tiny in-memory cache ---------- */
const COUSECS = 60 * 60 * 24; // 24 h
const cache: Record<
  "Country" | "Sector" | "ActivityStatus",
  { fetched: number; items: CodelistItem[] }
> = {
  Country: { fetched: 0, items: [] },
  Sector: { fetched: 0, items: [] },
  ActivityStatus: { fetched: 0, items: [] },
};

/* fallback if the live fetch fails */
const FALLBACK = {
  country: { uganda: "UG", kenya: "KE" },
  sector: { education: "111" },
  status: { ongoing: "2", completed: "4" },
};

async function loadCodelist(name: keyof typeof cache) {
  if (Date.now() - cache[name].fetched < COUSECS * 1000) return; // still fresh
  try {
    const url = `${CL_BASE}/${name}.json`;
    const j: { data: CodelistItem[] } = await fetch(url).then((r) => r.json());
    cache[name] = { fetched: Date.now(), items: j.data };
  } catch {
    // keep old / empty cache – tools will fall back
  }
}
/* helper: lookup functions -------------------------------------------------- */
function findCountryCode(q: string): string | undefined {
  const lc = q.toLowerCase();
  for (const { name, code } of cache.Country.items) {
    if (lc.includes(name.toLowerCase())) return code;
  }
  return (FALLBACK.country as any)[lc];
}
function findStatusCode(q: string): string | undefined {
  const lc = q.toLowerCase();
  for (const { name, code } of cache.ActivityStatus.items) {
    if (lc.includes(name.toLowerCase())) return code;
  }
  if (lc.includes("ongoing") || lc.includes("active")) return "2";
  if (lc.includes("completed")) return "4";
  return (FALLBACK.status as any)[lc];
}
function findSectorQuery(q: string): string | undefined {
  const lc = q.toLowerCase();
  for (const { name, code } of cache.Sector.items) {
    if (lc.includes(name.toLowerCase())) {
      // use a wildcard so sub-codes are included
      return `sector_code:${code}*`;
    }
  }
  const k = Object.keys(FALLBACK.sector).find((k) => lc.includes(k));
  if (k) return `sector_code:${(FALLBACK.sector as any)[k]}*`;
}

/* Smart builder: turns arg-bag -> URLSearchParams --------------------------- */
function buildParams(
  {
    keyword,
    country_code,
    min_value,
    max_value,
    start_date,
    end_date,
    activity_status_code,
    rows,
    start,
    facet_field,
    facet_limit,
  }: QueryArgs,
  collection: "activity" | "transaction" | "budget"
) {
  const p: Record<string, string> = {
    wt: "json",
    rows: rows ? String(rows) : "10",
    ...(start ? { start: String(start) } : {}),
  };

  /* free-text base query */
  const qParts: string[] = [];
  if (keyword) qParts.push(`(${keyword})`);
  if (country_code) qParts.push(`recipient_country_code:${country_code}`);
  if (activity_status_code)
    qParts.push(`activity_status_code:${activity_status_code}`);
  if (min_value || max_value) {
    const rng = `[${min_value ?? "*"} TO ${max_value ?? "*"}]`;
    const field =
      collection === "transaction"
        ? "transaction_value"
        : "budget_value"; // only if budget search
    qParts.push(`${field}:${rng}`);
  }
  if (start_date || end_date) {
    const field =
      collection === "transaction"
        ? "transaction_date_iso_date"
        : "activity_date_iso_date";
    qParts.push(`${field}:[${start_date ?? "*"} TO ${end_date ?? "*"}]`);
  }
  p.q = qParts.length ? qParts.join(" AND ") : "*:*";

  /* facet support */
  if (facet_field) {
    p.facet = "true";
    p["facet.field"] = String(facet_field);
    p["facet.limit"] = String(facet_limit ?? 20);
  }
  return new URLSearchParams(p);
}

/* -------------------------------------------------------------------------- */
export class MyMCP extends McpAgent {
  server = new McpServer({ name: "IATI MCP", version: "2.0.0" });

  async init() {
    // Load codelists once at startup (not awaited here so server boots fast)
    ["Country", "Sector", "ActivityStatus"].forEach((n) =>
      loadCodelist(n as any)
    );

    /* ------------------- get_iati_projects (ACTIVITY) --------------------- */
    this.server.tool(
      "get_iati_projects",
      {
        keyword: z.string().optional(),
        country_code: z.string().optional(),
        sample_size: z.number().optional(),
        facet_field: z.string().optional(),
        facet_limit: z.number().optional(),
        start: z.number().optional(),
      },
      async (raw) => {
        const params = buildParams(
          {
            ...raw,
            rows: raw.sample_size,
          },
          "activity"
        );
        const url = `${DS_BASE}/activity/select?${params.toString()}`;
        const json = await fetch(url).then((r) => r.json());
        return { content: [{ type: "json", json }] };
      }
    );

    /* ------------------ search_transactions (TRANSACTION) ---------------- */
    this.server.tool(
      "search_transactions",
      {
        keyword: z.string().optional(),
        country_code: z.string().optional(),
        min_value: z.number().optional(),
        max_value: z.number().optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        activity_status_code: z.string().optional(),
        sample_size: z.number().optional(),
        facet_field: z.string().optional(),
        facet_limit: z.number().optional(),
        start: z.number().optional(),
      },
      async (raw) => {
        const params = buildParams(
          {
            ...raw,
            rows: raw.sample_size,
          },
          "transaction"
        );
        const url = `${DS_BASE}/transaction/select?${params.toString()}`;
        const json = await fetch(url).then((r) => r.json());
        return { content: [{ type: "json", json }] };
      }
    );

    /* -------------------------- get_codelist ----------------------------- */
    this.server.tool(
      "get_codelist",
      {
        codelist_name: z.string(),
      },
      async ({ codelist_name }) => {
        const url = `${CL_BASE}/${codelist_name}.json`;
        const json = await fetch(url).then((r) => r.json());
        return { content: [{ type: "json", json }] };
      }
    );

    /* -------------- helper: interpret natural language ------------------- */
    this.server.tool(
      "interpret_query",
      {
        question: z.string(),
      },
      async ({ question }) => {
        // ensure codelists are loaded (refresh if older than 24 h)
        await Promise.all(
          ["Country", "Sector", "ActivityStatus"].map((n) =>
            loadCodelist(n as any)
          )
        );

        const country_code = findCountryCode(question);
        const status_code = findStatusCode(question);
        const sector_query = findSectorQuery(question);

        return {
          content: [
            {
              type: "json",
              json: {
                country_code,
                activity_status_code: status_code,
                sector_filter: sector_query,
              },
            },
          ],
        };
      }
    );
  }
}

/* -------------------------- Cloudflare worker entry ---------------------- */
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/sse"))
      // @ts-ignore
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);

    if (url.pathname === "/mcp")
      // @ts-ignore
      return MyMCP.serve("/mcp").fetch(request, env, ctx);

    return new Response("Not found", { status: 404 });
  },
};
