import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { siteConfigSchema } from "@/types/site";
import type { Database } from "@/integrations/supabase/types";

export const getPublishedSite = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({ slug: z.string().trim().min(1).max(80) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const url = process.env["SUPABASE_URL"]!;
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { data: project } = await client
      .from("projects")
      .select("name, slug, site_config, published_at")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();

    if (!project) return { found: false as const };
    const parsed = siteConfigSchema.safeParse(project.site_config);
    if (!parsed.success) return { found: false as const };
    return { found: true as const, name: project.name, config: parsed.data };
  });