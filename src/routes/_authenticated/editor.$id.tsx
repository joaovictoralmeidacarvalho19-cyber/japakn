import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Globe, History, ImagePlus, Loader2, Monitor, Send, Smartphone, Tablet } from "lucide-react";
import {
  configOf,
  getProject,
  listAiMessages,
  listVersions,
  publishProject,
  saveConfig,
  snapshotVersion,
  uploadProjectImage,
} from "@/lib/projects";
import { editSiteWithAi } from "@/lib/site.functions";
import { validateSite } from "@/lib/validate-site";
import { SiteRenderer } from "@/components/site-renderer/SiteRenderer";
import {
  EXPERIENCE_DESCRIPTIONS,
  EXPERIENCE_LABELS,
  EXPERIENCE_LEVELS,
  SECTION_LABELS,
  safeParseSiteConfig,
  type ExperienceLevel,
  type Section,
  type SiteConfig,
} from "@/types/site";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/editor/$id")({
  head: () => ({
    meta: [
      { title: "Editor de site — Japakn" },
      { name: "description", content: "Edite seu site por comandos ou manualmente e publique quando quiser." },
      { property: "og:title", content: "Editor de site — Japakn" },
      { property: "og:description", content: "Edite textos, cores e seções em poucos cliques." },
    ],
  }),
  component: Editor,
});

const DEVICES = {
  desktop: { label: "Desktop", width: "100%", icon: Monitor },
  tablet: { label: "Tablet", width: "768px", icon: Tablet },
  mobile: { label: "Celular", width: "390px", icon: Smartphone },
} as const;

function Editor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const editWithAi = useServerFn(editSiteWithAi);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
  });

  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
  const [instruction, setInstruction] = useState("");
  const [thinking, setThinking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const { data: versions = [], refetch: refetchVersions } = useQuery({
    queryKey: ["versions", id],
    queryFn: () => listVersions(id),
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["ai-messages", id],
    queryFn: () => listAiMessages(id),
  });

  useEffect(() => {
    if (project) setConfig(configOf(project));
  }, [project]);

  const sections = useMemo(() => config?.sections ?? [], [config]);

  function patch(next: Partial<SiteConfig>) {
    setConfig((prev) => (prev ? { ...prev, ...next } : prev));
  }

  /** Ajusta tema e seções ao nível escolhido (3D só no hero, com propósito). */
  function applyExperience(level: ExperienceLevel) {
    if (!config) return;
    const animations = level === "standard" ? "subtle" : "rich";
    const sections = config.sections.map((section) => {
      if (section.type !== "hero") return section;
      if (level === "cinematic") {
        return { ...section, three: section.three ?? { object: "abstract" as const, scrollCamera: true, intensity: "medium" as const } };
      }
      const { three: _drop, ...rest } = section;
      return rest as Section;
    });
    patch({ theme: { ...config.theme, experience: level, animations }, sections });
  }


  function updateSection(index: number, next: Partial<Section>) {
    if (!config) return;
    const list = [...config.sections];
    list[index] = { ...list[index], ...next } as Section;
    patch({ sections: list });
  }

  async function handleUpload(index: number, file: File) {
    setUploading(config?.sections[index]?.id ?? null);
    try {
      const url = await uploadProjectImage(id, file);
      updateSection(index, { image: url });
      toast.success("Imagem adicionada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não conseguimos enviar a imagem.");
    } finally {
      setUploading(null);
    }
  }

  async function restore(versionConfig: unknown) {
    const parsed = safeParseSiteConfig(versionConfig);
    if (!parsed) {
      toast.error("Esta versão não pode ser restaurada.");
      return;
    }
    if (config) await snapshotVersion(id, config, "Antes de restaurar");
    setConfig(parsed);
    await persist(parsed);
    await refetchVersions();
  }

  async function persist(next: SiteConfig) {
    setSaving(true);
    try {
      await saveConfig(id, next);
      await qc.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Alterações salvas.");
    } catch {
      toast.error("Não conseguimos salvar agora.");
    } finally {
      setSaving(false);
    }
  }

  async function askAi() {
    const text = instruction.trim();
    if (text.length < 2) return;
    setThinking(true);
    setInstruction("");
    try {
      const result = await editWithAi({ data: { projectId: id, instruction: text } });
      if (!result.ok) throw new Error(result.error);
      setConfig(result.config as SiteConfig);
      toast.success("Alteração aplicada.");
      await refetchVersions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não conseguimos aplicar essa alteração.");
    } finally {
      await refetchMessages();
      setThinking(false);
    }
  }

  async function publish() {
    if (!config) return;
    const issues = validateSite(config);
    const errors = issues.filter((i) => i.level === "error");
    const warnings = issues.filter((i) => i.level === "warning");
    if (errors.length) {
      toast.error("Ajuste antes de publicar", { description: errors.map((e) => e.message).join(" ") });
      return;
    }
    if (warnings.length) {
      toast.warning("Publicando com pendências", { description: warnings.map((w) => w.message).join(" ") });
    }
    try {
      await saveConfig(id, config);
      await publishProject(id);
      await qc.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Site publicado!");
    } catch {
      toast.error("Não conseguimos publicar agora.");
    }
  }

  if (isLoading || !config) {
    return (
      <div className="min-h-screen space-y-4 bg-muted/30 p-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-[70vh] w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
            Voltar
          </Button>
          <span className="font-display font-semibold">{config.business.name || "Meu site"}</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map((key) => {
            const Icon = DEVICES[key].icon;
            return (
              <button
                key={key}
                type="button"
                aria-label={DEVICES[key].label}
                onClick={() => setDevice(key)}
                className={`rounded-md p-2 transition-colors ${
                  device === key ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => persist(config)} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          {project?.status === "published" && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/s/$slug" params={{ slug: project.slug }} target="_blank">
                Ver online
              </Link>
            </Button>
          )}
          <Button size="sm" onClick={publish}>
            <Globe className="mr-2 h-4 w-4" /> Publicar
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="w-full border-b border-border bg-background lg:w-96 lg:border-b-0 lg:border-r">
          <Tabs defaultValue="ia" className="flex h-full flex-col">
            <TabsList className="m-3 grid grid-cols-4">
              <TabsTrigger value="ia">Assistente</TabsTrigger>
              <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="versoes">Versões</TabsTrigger>
            </TabsList>

            <TabsContent value="ia" className="flex-1 space-y-3 px-4 pb-4">
              <p className="text-sm text-muted-foreground">
                Peça em português. Ex.: “deixe as cores mais escuras”, “troque o título do destaque”, “adicione uma
                seção de perguntas frequentes”.
              </p>
              {messages.length > 0 && (
                <ul className="max-h-64 space-y-2 overflow-auto rounded-lg border border-border p-3">
                  {messages.map((message) => (
                    <li
                      key={message.id}
                      className={`rounded-md px-3 py-2 text-sm ${
                        message.role === "user"
                          ? "bg-primary/10 text-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {message.content}
                    </li>
                  ))}
                </ul>
              )}
              <Textarea
                rows={4}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="O que você quer mudar?"
              />
              <Button onClick={askAi} disabled={thinking} className="w-full">
                {thinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {thinking ? "Aplicando..." : "Aplicar mudança"}
              </Button>
            </TabsContent>

            <TabsContent value="conteudo" className="flex-1 space-y-4 overflow-auto px-4 pb-6">
              <div className="space-y-2">
                <Label htmlFor="bizname">Nome do negócio</Label>
                <Input
                  id="bizname"
                  value={config.business.name}
                  onChange={(e) => patch({ business: { ...config.business, name: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Seções</Label>
                <ul className="space-y-2">
                  {sections.map((section, index) => (
                    <li key={section.id} className="rounded-lg border border-border text-sm">
                      <div className="flex items-center justify-between px-3 py-2">
                        <button
                          type="button"
                          className="flex-1 text-left font-medium"
                          onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                        >
                          {SECTION_LABELS[section.type]}
                        </button>
                        <button
                          type="button"
                          aria-label={section.visible === false ? "Mostrar seção" : "Ocultar seção"}
                          onClick={() => updateSection(index, { visible: section.visible === false })}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {section.visible === false ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {openSection === section.id && (
                        <div className="space-y-3 border-t border-border px-3 py-3">
                          <div className="space-y-1">
                            <Label htmlFor={`${section.id}-title`}>Título</Label>
                            <Input
                              id={`${section.id}-title`}
                              value={section.title ?? ""}
                              onChange={(e) => updateSection(index, { title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`${section.id}-subtitle`}>Subtítulo</Label>
                            <Input
                              id={`${section.id}-subtitle`}
                              value={section.subtitle ?? ""}
                              onChange={(e) => updateSection(index, { subtitle: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`${section.id}-desc`}>Texto</Label>
                            <Textarea
                              id={`${section.id}-desc`}
                              rows={3}
                              value={section.description ?? ""}
                              onChange={(e) => updateSection(index, { description: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`${section.id}-image`}>Imagem</Label>
                            <div className="flex items-center gap-2">
                              <input
                                id={`${section.id}-image`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) void handleUpload(index, file);
                                  e.target.value = "";
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploading === section.id}
                                onClick={() => document.getElementById(`${section.id}-image`)?.click()}
                              >
                                {uploading === section.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <ImagePlus className="mr-2 h-4 w-4" />
                                )}
                                Enviar imagem
                              </Button>
                              {section.image && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateSection(index, { image: undefined })}
                                >
                                  Remover
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="design" className="flex-1 space-y-4 px-4 pb-6">
              {(
                [
                  ["primaryColor", "Cor principal"],
                  ["secondaryColor", "Cor secundária"],
                  ["backgroundColor", "Fundo"],
                  ["textColor", "Texto"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <Label htmlFor={key}>{label}</Label>
                  <input
                    id={key}
                    type="color"
                    value={config.theme[key]}
                    onChange={(e) => patch({ theme: { ...config.theme, [key]: e.target.value } })}
                    className="h-9 w-16 cursor-pointer rounded-md border border-border bg-background"
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Cantos</Label>
                <div className="flex flex-wrap gap-2">
                  {(["none", "sm", "md", "lg", "xl"] as const).map((radius) => (
                    <button
                      key={radius}
                      type="button"
                      onClick={() => patch({ theme: { ...config.theme, borderRadius: radius } })}
                      className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                        config.theme.borderRadius === radius
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {radius}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Espaçamento</Label>
                <div className="flex flex-wrap gap-2">
                  {(["compact", "normal", "spacious"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => patch({ theme: { ...config.theme, spacing: value } })}
                      className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                        config.theme.spacing === value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {value === "compact" ? "Compacto" : value === "normal" ? "Normal" : "Amplo"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Animações</Label>
                <div className="flex flex-wrap gap-2">
                  {(["none", "subtle", "rich"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => patch({ theme: { ...config.theme, animations: value } })}
                      className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                        config.theme.animations === value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {value === "none" ? "Nenhuma" : value === "subtle" ? "Suaves" : "Intensas"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nível da experiência</Label>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => applyExperience(level)}
                      className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                        config.theme.experience === level
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {EXPERIENCE_LABELS[level]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {EXPERIENCE_DESCRIPTIONS[config.theme.experience]}
                </p>
              </div>
            </TabsContent>


            <TabsContent value="versoes" className="flex-1 space-y-3 overflow-auto px-4 pb-6">
              <p className="text-sm text-muted-foreground">
                Cada alteração automática gera uma versão. Você pode voltar quando quiser.
              </p>
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma versão salva ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {versions.map((version) => (
                    <li
                      key={version.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{version.label || "Versão"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(version.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => restore(version.site_config)}>
                        <History className="mr-2 h-4 w-4" /> Restaurar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </aside>

        <main className="flex-1 overflow-auto bg-muted/40 p-4">
          <div
            className="mx-auto overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all"
            style={{ width: DEVICES[device].width, maxWidth: "100%" }}
          >
            <SiteRenderer config={config} />
          </div>
        </main>
      </div>
    </div>
  );
}
