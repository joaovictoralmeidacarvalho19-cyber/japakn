import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Eye,
  Rocket,
  Smartphone,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import editorPreview from "@/assets/editor-preview.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Japakn — Crie seu site profissional em minutos" },
      {
        name: "description",
        content:
          "Descreva seu negócio e o Japakn monta, edita e publica um site profissional e responsivo em poucos minutos.",
      },
      { property: "og:title", content: "Japakn — Crie seu site profissional em minutos" },
      {
        property: "og:description",
        content: "Descreva seu negócio e transforme sua ideia em um site profissional.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: Wand2,
    title: "Descreva",
    text: "Conte em poucas frases o que seu negócio faz. Sem formulários longos.",
  },
  {
    icon: Sparkles,
    title: "Personalize",
    text: "Peça mudanças em português e ajuste textos, cores e seções na hora.",
  },
  {
    icon: Rocket,
    title: "Publique",
    text: "Um clique e seu site fica no ar, com endereço próprio para compartilhar.",
  },
];

const FEATURES = [
  { icon: Bot, title: "Criação automática", text: "Estrutura, textos e design gerados a partir da sua descrição." },
  { icon: Smartphone, title: "Design responsivo", text: "Perfeito no celular, no tablet e no computador." },
  { icon: Wand2, title: "Editor por comandos", text: "“Deixe mais luxuoso”, “troque a cor para azul”. Pronto." },
  { icon: Eye, title: "Preview em tempo real", text: "Veja cada alteração acontecer na hora, sem recarregar." },
  { icon: Rocket, title: "Publicação rápida", text: "Seu site no ar em segundos, com título e descrição otimizados." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] bg-[radial-gradient(60%_60%_at_50%_40%,var(--color-accent)/25,transparent)] opacity-30"
          />
          <div className="relative mx-auto max-w-6xl px-6 pb-8 pt-16 text-center md:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Sites profissionais criados em minutos
            </span>
            <h1 className="animate-fade-up mx-auto mt-7 max-w-4xl text-5xl font-bold leading-[1.02] text-balance-tight md:text-7xl">
              Crie seu site em minutos.
            </h1>
            <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Descreva seu negócio e tenha um site profissional pronto em poucos minutos.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7 text-base shadow-lift">
                <Link to="/auth" search={{ mode: "signup" }}>
                  ✨ Criar meu site
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-7 text-base">
                <a href="#como-funciona">Ver como funciona</a>
              </Button>
            </div>

            <div className="animate-fade-up mx-auto mt-16 max-w-5xl">
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
                <img
                  src={editorPreview}
                  alt="Editor do Japakn com painel de comandos, preview do site e ajustes rápidos"
                  width={1600}
                  height={1008}
                  className="w-full"
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Painel de comandos à esquerda, seu site ao vivo no centro, ajustes rápidos à direita.
              </p>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center text-3xl font-bold md:text-5xl">Como funciona</h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border bg-card p-8 shadow-soft transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="mt-6 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Passo {i + 1}
                </span>
                <h3 className="mt-1 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="recursos" className="border-y border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="max-w-2xl text-3xl font-bold md:text-5xl">
              Tudo que você precisa. Nada que atrapalhe.
            </h2>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-border bg-card p-7 shadow-soft">
                  <feature.icon className="h-5 w-5 text-accent" />
                  <h3 className="mt-5 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-lift">
            <h2 className="text-3xl font-bold md:text-5xl">Seu próximo site começa aqui.</h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/70">
              Leva menos tempo do que explicar seu negócio para um designer.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-9 h-12 px-7 text-base">
              <Link to="/auth" search={{ mode: "signup" }}>
                Começar gratuitamente <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span className="font-semibold text-foreground">Japakn</span>
          <span>© {new Date().getFullYear()} Japakn. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
