import { supabase } from "@/integrations/supabase/client";
import { emptySiteConfig, safeParseSiteConfig, type SiteConfig } from "@/types/site";

export type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  status: string;
  site_config: unknown;
  updated_at: string;
  published_at: string | null;
};

export function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "site"
  );
}

export async function listProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, slug, category, description, status, site_config, updated_at, published_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectRow[];
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, slug, category, description, status, site_config, updated_at, published_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as ProjectRow) ?? null;
}

export async function createProject(input: { name: string; category?: string; description?: string }) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Faça login para criar um site.");

  const base = slugify(input.name);
  const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: input.name || "Meu site",
      slug,
      category: input.category ?? null,
      description: input.description ?? null,
      status: "draft",
      site_config: emptySiteConfig(input.name) as unknown as never,
    })
    .select("id, slug")
    .single();
  if (error) throw error;
  return data;
}

export async function saveConfig(projectId: string, config: SiteConfig) {
  const { error } = await supabase
    .from("projects")
    .update({ site_config: config as unknown as never, name: config.business.name || "Meu site" })
    .eq("id", projectId);
  if (error) throw error;
}

export async function snapshotVersion(projectId: string, config: SiteConfig, label: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await supabase.from("versions").insert({
    project_id: projectId,
    user_id: userData.user.id,
    site_config: config as unknown as never,
    label,
  });
}

export async function publishProject(projectId: string) {
  const { error } = await supabase
    .from("projects")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", projectId);
  if (error) throw error;
}

export async function unpublishProject(projectId: string) {
  const { error } = await supabase.from("projects").update({ status: "ready" }).eq("id", projectId);
  if (error) throw error;
}

export async function deleteProject(projectId: string) {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

export async function uploadProjectImage(projectId: string, file: File): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Faça login para enviar imagens.");
  if (!file.type.startsWith("image/")) throw new Error("Envie um arquivo de imagem.");
  if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${projectId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("project-assets").upload(path, file, { upsert: false });
  if (error) throw error;

  const { data: signed, error: signError } = await supabase.storage
    .from("project-assets")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  if (signError || !signed) throw signError ?? new Error("Não conseguimos gerar o link da imagem.");

  await supabase.from("assets").insert({
    project_id: projectId,
    user_id: userId,
    url: signed.signedUrl,
    type: "image",
  });

  return signed.signedUrl;
}

export function configOf(project: Pick<ProjectRow, "site_config" | "name">): SiteConfig {
  return safeParseSiteConfig(project.site_config) ?? emptySiteConfig(project.name);
}

export type VersionRow = {
  id: string;
  label: string | null;
  created_at: string;
  site_config: unknown;
};

export async function listVersions(projectId: string): Promise<VersionRow[]> {
  const { data, error } = await supabase
    .from("versions")
    .select("id, label, created_at, site_config")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as VersionRow[];
}