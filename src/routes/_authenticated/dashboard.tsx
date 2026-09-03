import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { Download, ExternalLink, FileArchive, Loader2, Plus, Trash2 } from "lucide-react";
import { buildSiteZip, downloadBlob } from "@/lib/export-site";
import { deleteProject, listProjects, unpublishProject } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Meus sites — Japakn" },
      { name: "description", content: "Gerencie, edite e publique todos os seus sites." },
      { property: "og:title", content: "Meus sites — Japakn" },
      { property: "og:description", content: "Gerencie, edite e publique todos os seus sites." },
    ],
  }),
  component: Dashboard,
});

const STATUS: Record<string, { label: string; variant: "secondary" | "default" | "outline" }> = {
  draft: { label: "Rascunho", variant: "outline" },
  ready: { label: "Pronto", variant: "secondary" },
  published: { label: "Publicado", variant: "default" },
};

function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["projects"], queryFn: listProjects });
  const [zipping, setZipping] = useState<string | null>(null);

  async function downloadZip(slug: string, name: string) {
    setZipping(slug);
    try {
      const blob = await buildSiteZip(slug);
      downloadBlob(blob, `${slug || name || "site"}.zip`);
      toast.success("ZIP gerado com todos os arquivos.");
    } catch {
      toast.error("Não conseguimos gerar o ZIP agora.");
    } finally {
      setZipping(null);
    }
  }


  async function downloadSite(slug: string, name: string) {
    try {
      const res = await fetch(`/s/${slug}`);
      if (!res.ok) throw new Error();
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug || name || "site"}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Arquivo baixado.");
    } catch {
      toast.error("Não conseguimos gerar o arquivo agora.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este site definitivamente?")) return;
    try {
      await deleteProject(id);
      await qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Site excluído.");
    } catch {
      toast.error("Não conseguimos excluir agora.");
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="font-display text-lg font-bold">
            Japakn
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Meus sites</h1>
            <p className="mt-1 text-muted-foreground">Crie, edite e publique seus sites em minutos.</p>
          </div>
          <Button asChild>
            <Link to="/criar">
              <Plus className="mr-2 h-4 w-4" /> Criar novo site
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}

          {!isLoading && (data?.length ?? 0) === 0 && (
            <Card className="sm:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="font-display">Nenhum site ainda</CardTitle>
                <CardDescription>
                  Descreva seu negócio em uma frase e receba seu site completo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/criar">Criar meu primeiro site</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {data?.map((project) => {
            const status = STATUS[project.status] ?? STATUS["draft"]!;
            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-display text-lg">{project.name}</CardTitle>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description || project.category || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link to="/editor/$id" params={{ id: project.id }}>
                      Editar
                    </Link>
                  </Button>
                  {project.status === "published" && (
                    <>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/s/$slug" params={{ slug: project.slug }} target="_blank">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Ver site
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSite(project.slug, project.name)}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Baixar HTML
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={zipping === project.slug}
                        onClick={() => downloadZip(project.slug, project.name)}
                      >
                        {zipping === project.slug ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileArchive className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Baixar como ZIP
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await unpublishProject(project.id);
                          await qc.invalidateQueries({ queryKey: ["projects"] });
                          toast.success("Site despublicado.");
                        }}
                      >
                        Despublicar
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(project.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
