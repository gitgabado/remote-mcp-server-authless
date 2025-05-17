import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with IATI tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "IATI MCP",
		version: "1.0.0",
	});

	async init() {
		// get_iati_projects tool
		this.server.tool(
			"get_iati_projects",
			{
				keyword: z.string(),
				country_code: z.string().optional(),
				sample_size: z.number().optional(),
				facet_limit: z.number().optional(),
			},
			async ({ keyword, country_code, sample_size, facet_limit }: { keyword: string; country_code?: string; sample_size?: number; facet_limit?: number }) => {
				const params = new URLSearchParams({
					q: keyword,
					...(country_code ? { country_code } : {}),
					...(sample_size ? { sample_size: String(sample_size) } : {}),
					...(facet_limit ? { facet_limit: String(facet_limit) } : {}),
				});
				const url = `https://api.iatistandard.org/datastore/projects?${params.toString()}`;
				const resp = await fetch(url);
				const data = await resp.json();
				return { content: [{ type: "json", json: data }] };
			}
		);

		// search_transactions tool
		this.server.tool(
			"search_transactions",
			{
				keyword: z.string().optional(),
				country_code: z.string().optional(),
				min_value: z.number().optional(),
				max_value: z.number().optional(),
				start_date: z.string().optional(),
				end_date: z.string().optional(),
				sample_size: z.number().optional(),
				facet_limit: z.number().optional(),
			},
			async (args: { [key: string]: string | number | undefined }) => {
				const params = new URLSearchParams(
					Object.entries(args)
						.filter(([_, v]) => v !== undefined && v !== null)
						.map(([k, v]) => [k, String(v)])
				);
				const url = `https://api.iatistandard.org/datastore/transactions?${params.toString()}`;
				const resp = await fetch(url);
				const data = await resp.json();
				return { content: [{ type: "json", json: data }] };
			}
		);

		// get_codelist tool
		this.server.tool(
			"get_codelist",
			{
				codelist_name: z.string(),
				format: z.string().optional(),
				cl_version: z.string().optional(),
				language: z.string().optional(),
			},
			async ({ codelist_name, format, cl_version, language }: { codelist_name: string; format?: string; cl_version?: string; language?: string }) => {
				const params = new URLSearchParams({
					...(format ? { format } : {}),
					...(cl_version ? { cl_version } : {}),
					...(language ? { language } : {}),
				});
				const url = `https://api.iatistandard.org/codelists/${codelist_name}?${params.toString()}`;
				const resp = await fetch(url);
				const data = await resp.json();
				return { content: [{ type: "json", json: data }] };
			}
		);

		// get_codelist_mapping tool
		this.server.tool(
			"get_codelist_mapping",
			{
				from_codelist: z.string(),
				to_codelist: z.string(),
				format: z.string().optional(),
				cl_version: z.string().optional(),
				language: z.string().optional(),
			},
			async ({ from_codelist, to_codelist, format, cl_version, language }: { from_codelist: string; to_codelist: string; format?: string; cl_version?: string; language?: string }) => {
				const params = new URLSearchParams({
					...(format ? { format } : {}),
					...(cl_version ? { cl_version } : {}),
					...(language ? { language } : {}),
				});
				const url = `https://api.iatistandard.org/codelists/mapping/${from_codelist}/${to_codelist}?${params.toString()}`;
				const resp = await fetch(url);
				const data = await resp.json();
				return { content: [{ type: "json", json: data }] };
			}
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			// @ts-ignore
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			// @ts-ignore
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
