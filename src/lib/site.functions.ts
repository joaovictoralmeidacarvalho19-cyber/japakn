import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { siteConfigSchema } from "@/types/site";

export const analyzeBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        description: z.string().trim().min(10).max(4000),
        category: z.string().trim().max(60).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { aiAnalyzeBusiness, AiError } = await import("./ai.server");
    try {
      const result = await aiAnalyzeBusiness(data.description, data.category);
      return { ok: true as const, ...result };
    } catch (error) {
      console.error(error);
      return {
        ok: false as const,
        business: {},
        questions: [],
        error: error instanceof AiError ? error.message : "Não conseguimos analisar sua descrição.",
      };
    }
  });

export const generateSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        description: z.string().trim().min(10).max(4000),
        category: z.string().trim().max(60).optional(),
        style: z.string().trim().max(40).optional(),
        primaryColor: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
        goal: z.string().trim().max(60).optional(),
        experience: z.enum(["standard", "premium", "cinematic"]).optional(),
        answers: z.record(z.string().max(40), z.string().max(500)).optional(),

      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { aiGenerateSite, AiError } = await import("./ai.server");
    const { supabase, userId } = context;

    const { data: project, error: loadError } = await supabase
      .from("projects")
      .select("id, site_config")
      .eq("id", data.projectId)
      .maybeSingle();
    if (loadError || !project) return { ok: false as const, error: "Projeto não encontrado." };

    try {
      const config = await aiGenerateSite({
        description: data.description,
        ...(data.category ? { category: data.category } : {}),
        ...(data.style ? { style: data.style } : {}),
        ...(data.primaryColor ? { primaryColor: data.primaryColor } : {}),
        ...(data.goal ? { goal: data.goal } : {}),
        ...(data.experience ? { experience: data.experience } : {}),
        ...(data.answers ? { answers: data.answers } : {}),

      });

      const { error: saveError } = await supabase
        .from("projects")
        .update({
          site_config: config,
          name: config.business.name || "Meu site",
          status: "ready",
          ...(data.category ? { category: data.category } : {}),
          description: data.description,
        })
        .eq("id", data.projectId);
      if (saveError) throw saveError;

      await supabase.from("versions").insert({
        project_id: data.projectId,
        user_id: userId,
        site_config: config,
        label: "Versão gerada automaticamente",
      });

      return { ok: true as const, config };
    } catch (error) {
      console.error(error);
      return {
        ok: false as const,
        error: error instanceof AiError ? error.message : "Não conseguimos gerar o site. Tente novamente.",
      };
    }
  });

export const editSiteWithAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        instruction: z.string().trim().min(2).max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { aiEditSite, AiError } = await import("./ai.server");
    const { supabase, userId } = context;

    const { data: project } = await supabase
      .from("projects")
      .select("id, site_config")
      .eq("id", data.projectId)
      .maybeSingle();
    if (!project) return { ok: false as const, error: "Projeto não encontrado." };

    const current = siteConfigSchema.safeParse(project.site_config);
    if (!current.success) return { ok: false as const, error: "Este site ainda não foi gerado." };

    await supabase.from("ai_messages").insert({
      project_id: data.projectId,
      user_id: userId,
      role: "user",
      content: data.instruction,
    });

    try {
      const updated = await aiEditSite(current.data, data.instruction);

      // Guarda a versão anterior ANTES de sobrescrever.
      await supabase.from("versions").insert({
        project_id: data.projectId,
        user_id: userId,
        site_config: current.data,
        label: data.instruction.slice(0, 80),
      });

      const { error: saveError } = await supabase
        .from("projects")
        .update({ site_config: updated, name: updated.business.name || "Meu site" })
        .eq("id", data.projectId);
      if (saveError) throw saveError;

      await supabase.from("ai_messages").insert({
        project_id: data.projectId,
        user_id: userId,
        role: "assistant",
        content: "Alteração aplicada com sucesso.",
      });

      return { ok: true as const, config: updated };
    } catch (error) {
      console.error(error);
      const message =
        error instanceof AiError ? error.message : "Não conseguimos aplicar essa alteração. Seu site foi preservado.";
      await supabase.from("ai_messages").insert({
        project_id: data.projectId,
        user_id: userId,
        role: "assistant",
        content: message,
      });
      return { ok: false as const, error: message };
    }
  });