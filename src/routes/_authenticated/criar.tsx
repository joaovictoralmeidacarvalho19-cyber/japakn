import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { analyzeBusiness, generateSite } from "@/lib/site.functions";
import { createProject } from "@/lib/projects";
import {
  CATEGORIES,
  EXPERIENCE_DESCRIPTIONS,
  EXPERIENCE_LABELS,
  EXPERIENCE_LEVELS,
  GOALS,
  VISUAL_STYLES,
  type ExperienceLevel,
} from "@/types/site";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/criar")({
  head: () => ({
    meta: [
      { title: "Criar site — Japakn" },
      { name: "description", content: "Descreva seu negócio e receba um site completo, pronto para publicar." },
      { property: "og:title", content: "Criar site — Japakn" },
      { property: "og:description", content: "Descreva seu negócio e receba um site completo em minutos." },
    ],
  }),
  component: CreateFlow,
});

const PALETTE = ["#0f766e", "#1d4ed8", "#b91c1c", "#7c3aed", "#c2410c", "#111827"];

function CreateFlow() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeBusiness);
  const generate = useServerFn(generateSite);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [goal, setGoal] = useState<string>(GOALS[0]);
  const [questions, setQuestions] = useState<{ key: string; label: string }[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [style, setStyle] = useState<string>("moderno");
  const [primaryColor, setPrimaryColor] = useState(PALETTE[0]!);
  const [businessName, setBusinessName] = useState("");
  const [experience, setExperience] = useState<ExperienceLevel>("premium");

  async function handleAnalyze() {
    if (description.trim().length < 10) {
      toast.error("Conte um pouco mais sobre o seu negócio.");
      return;
    }
    setBusy(true);
    try {
      const result = await analyze({
        data: { description: description.trim(), ...(category ? { category } : {}) },
      });
      if (!result.ok) toast.info(result.error ?? "Seguindo sem análise automática.");
      const business = (result.business ?? {}) as Record<string, string>;
      if (business["name"]) setBusinessName(business["name"]);
      setQuestions(result.questions ?? []);
      setStep(1);
    } catch {
      toast.error("Não conseguimos analisar agora. Você pode continuar mesmo assim.");
      setStep(1);
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate() {
    setBusy(true);
    setStep(3);
    try {
      const project = await createProject({
        name: businessName || "Meu site",
        ...(category ? { category } : {}),
        description: description.trim(),
      });
      const result = await generate({
        data: {
          projectId: project.id,
          description: description.trim(),
          ...(category ? { category } : {}),
          style,
          primaryColor,
          goal,
          experience,
          answers,
        },
      });
      if (!result.ok) throw new Error(result.error);
      toast.success("Seu site está pronto!");
      navigate({ to: "/editor/$id", params: { id: project.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não conseguimos gerar o site.");
      setStep(2);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link to="/dashboard" className="font-display text-lg font-bold">
            Japakn
          </Link>
          <span className="text-sm text-muted-foreground">Passo {Math.min(step + 1, 4)} de 4</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Descreva seu negócio</CardTitle>
              <CardDescription>
                Escreva com suas palavras. Cuidamos do resto — nome, serviços, tom e estrutura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="desc">Sobre o negócio</Label>
                <Textarea
                  id="desc"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex.: Sou barbeiro em Campinas, atendo com hora marcada, faço corte, barba e sobrancelha. Quero receber agendamentos pelo WhatsApp."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCategory(item === category ? "" : item)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          category === item
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-accent"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Objetivo principal</Label>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setGoal(item)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          goal === item
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-accent"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={handleAnalyze} disabled={busy} size="lg">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Só mais alguns detalhes</CardTitle>
              <CardDescription>
                {questions.length
                  ? "Essas informações deixam seu site completo."
                  : "Tudo certo! Confirme o nome do seu negócio."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="bizname">Nome do negócio</Label>
                <Input
                  id="bizname"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex.: Barbearia do João"
                />
              </div>
              {questions.map((question) => (
                <div key={question.key} className="space-y-2">
                  <Label htmlFor={question.key}>{question.label}</Label>
                  <Input
                    id={question.key}
                    value={answers[question.key] ?? ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [question.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Voltar
                </Button>
                <Button onClick={() => setStep(2)}>Continuar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Escolha o visual</CardTitle>
              <CardDescription>Você poderá mudar tudo depois, quando quiser.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Estilo</Label>
                <div className="flex flex-wrap gap-2">
                  {VISUAL_STYLES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setStyle(item)}
                      className={`rounded-full border px-4 py-2 text-sm capitalize transition-colors ${
                        style === item
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-accent"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor principal</Label>
                <div className="flex flex-wrap gap-3">
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Cor ${color}`}
                      onClick={() => setPrimaryColor(color)}
                      style={{ backgroundColor: color }}
                      className={`h-10 w-10 rounded-full ring-offset-2 transition-all ${
                        primaryColor === color ? "ring-2 ring-foreground" : ""
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    aria-label="Cor personalizada"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border border-border bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nível da experiência</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setExperience(level)}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        experience === level ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{EXPERIENCE_LABELS[level]}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {EXPERIENCE_DESCRIPTIONS[level]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button size="lg" onClick={handleGenerate} disabled={busy}>
                  <Sparkles className="mr-2 h-4 w-4" /> Gerar meu site
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-20 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <h2 className="font-display text-2xl font-bold">Criando seu site...</h2>
              <p className="max-w-sm text-muted-foreground">
                Estamos escrevendo os textos, escolhendo as seções e montando o design. Leva menos de um minuto.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
