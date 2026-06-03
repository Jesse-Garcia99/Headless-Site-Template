import { client } from "@/tina/__generated__/client";

export async function getSiteData() {
  const result = await client.queries.site({ relativePath: "site.json" });
  return {
    data: result.data,
    variables: result.variables,
    query: result.query,
  };
}
