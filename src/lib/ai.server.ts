import { siteConfigSchema, type SiteConfig } from "@/types/site";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.5-flash";

export class AiError extends Error {}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Camada única de acesso ao provedor de IA — trocar de provedor só exige mudar aqui. */
export async function chatJson(messages: ChatMessage[], attempt = 0): Promise<unknown> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("Serviço indisponível no momento.");

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (response.status === 429) throw new AiError("Muitas solicitações agora. Tente de novo em instantes.");
  if (response.status === 402) throw new AiError("Os créditos acabaram. Recarregue para continuar.");
  if (!response.ok) {
    const detail = await response.text();
    console.error("AI gateway error", response.status, detail.slice(0, 400));
    if (attempt < 1) return chatJson(messages, attempt + 1);
    throw new AiError("Não conseguimos gerar agora. Tente novamente.");
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(stripFence(content));
  } catch {
    if (attempt < 1) return chatJson(messages, attempt + 1);
    throw new AiError("Recebemos um formato inesperado. Tente novamente.");
  }
}

function stripFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

const SCHEMA_DOC = `
Estrutura obrigatória (JSON):
{
  "version": 1,
  "business": { "name", "category", "description", "phone", "whatsapp", "email", "address", "city", "instagram", "hours", "audience", "goal" },
  "theme": { "primaryColor": "#hex", "secondaryColor": "#hex", "backgroundColor": "#hex", "textColor": "#hex",
             "font": "sans|display|serif|mono", "borderRadius": "none|sm|md|lg|xl",
             "spacing": "compact|normal|spacious", "visualStyle": "moderno|minimalista|elegante|luxuoso|criativo|corporativo|futurista",
             "experience": "standard|premium|cinematic", "animations": "none|subtle|rich" },
  "seo": { "title": "até 60 caracteres", "description": "até 155 caracteres" },
  "sections": [ { "id": "unico", "type": "navbar|hero|about|services|pricing|gallery|testimonials|faq|contact|location|cta|footer",
                  "visible": true, "title", "subtitle", "description", "buttonText", "buttonUrl",
                  "secondaryButtonText", "secondaryButtonUrl", "image", "alignment": "left|center",
                  "animation": "none|fade|slide-up|slide-left|scale|blur|reveal",
                  "background": "default|tint|contrast|gradient",
                  "three": { "object": "particles|product|vehicle|architecture|abstract", "scrollCamera": true, "intensity": "low|medium|high" },
                  "items": [ { "title", "description", "price", "features": [], "highlighted",
                               "name", "role", "quote", "question", "answer", "label", "url", "image" } ],
                  "phone", "whatsapp", "email", "address", "city", "instagram", "hours", "mapQuery" } ]
}`;

const RULES = `
Regras rígidas:
- Responda SOMENTE com JSON válido, sem comentários e sem markdown.
- Escreva todos os textos em português do Brasil, com tom profissional e humano.
- NUNCA invente telefone, WhatsApp, e-mail, endereço, preços ou depoimentos com nomes reais que o usuário não informou.
  Se o dado não foi informado, omita o campo ou a seção que depende dele.
- Não use URLs de imagens externas. Deixe o campo "image" vazio quando não houver imagem do usuário.
- Sempre inclua as seções navbar, hero, contact e footer.
- Máximo de 12 seções. Cada id deve ser único e em minúsculas.

Decisões por nicho (escolha a estrutura certa, não uma lista genérica):
- Restaurante/gastronomia: hero + about + services (cardápio) + gallery + testimonials + location + contact.
- Barbearia/salão/clínica: hero + services + pricing + gallery + testimonials + faq + contact + location.
- Loja/e-commerce simples: hero + gallery (produtos) + services + faq + contact.
- Serviços profissionais/empresa/imobiliária: hero + about + services + pricing (se fizer sentido) + testimonials + faq + contact.
- Fotógrafo/criativo: hero + gallery + about + testimonials + contact.

Ritmo visual:
- Alterne "background" entre "default", "tint" e "gradient" para criar respiro; use "contrast" no máximo uma vez.
- Defina "animation" coerente: "reveal" ou "slide-up" em seções de conteúdo, "fade" em contato/rodapé, "none" na navbar.

Nível de experiência:
- standard: sem "three", animations "subtle".
- premium: animations "rich", fundos variados, sem "three" (ou apenas "particles" discreto no hero).
- cinematic: animations "rich" e um único bloco "three" no hero, com "object" que faça sentido para o negócio
  (vehicle para automotivo, product para loja/produto, architecture para imobiliária/construção,
   particles para tecnologia/eventos, abstract quando nada se encaixar). Nunca use 3D como enfeite sem propósito.`;


export async function aiAnalyzeBusiness(description: string, category?: string) {
  const schema = z.object({
    business: z.record(z.string(), z.string().max(500)).default({}),
    questions: z
      .array(z.object({ key: z.string().max(40), label: z.string().max(200) }))
      .max(4)
      .default([]),
  });
  const raw = await chatJson([
    {
      role: "system",
      content: `Você extrai informações de negócio a partir de um texto livre em português.
Responda JSON: { "business": { campos encontrados entre name, category, description, services, phone, whatsapp, email, address, city, instagram, hours, audience }, "questions": [ { "key", "label" } ] }.
Em "questions", pergunte no máximo 3 informações CRÍTICAS que faltam para o site funcionar (ex.: forma de contato, cidade, nome do negócio). Pergunte de forma simples e curta. Nunca invente dados.`,
    },
    { role: "user", content: `Categoria: ${category ?? "não informada"}\nDescrição: ${description}` },
  ]);
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : { business: {}, questions: [] };
}

export async function aiGenerateSite(input: {
  description: string;
  category?: string;
  style?: string;
  primaryColor?: string;
  goal?: string;
  experience?: string;
  answers?: Record<string, string>;
}): Promise<SiteConfig> {
  const answers = Object.entries(input.answers ?? {})
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Você é um designer e redator que monta a configuração estruturada de um site institucional.
${SCHEMA_DOC}
${RULES}`,
    },
    {
      role: "user",
      content: `Descrição do negócio: ${input.description}
Categoria: ${input.category ?? "não informada"}
Estilo visual desejado: ${input.style ?? "moderno"}
Cor principal desejada: ${input.primaryColor ?? "escolha uma adequada ao segmento"}
Objetivo principal do site: ${input.goal ?? "Apresentar empresa"}
Nível de experiência: ${input.experience ?? "standard"} (respeite exatamente as regras desse nível e use esse valor em theme.experience)
Informações extras fornecidas:\n${answers || "nenhuma"}

Gere o site completo agora.`,
    },
  ];

  return validateWithRetry(messages);
}


export async function aiEditSite(config: SiteConfig, instruction: string): Promise<SiteConfig> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Você edita a configuração estruturada de um site conforme o pedido do usuário.
${SCHEMA_DOC}
${RULES}
- Devolva o JSON COMPLETO e atualizado do site, preservando tudo que não foi pedido para mudar.
- Não apague informações de contato existentes.`,
    },
    {
      role: "user",
      content: `Configuração atual:\n${JSON.stringify(config)}\n\nPedido do usuário: ${instruction}`,
    },
  ];
  return validateWithRetry(messages);
}

async function validateWithRetry(messages: ChatMessage[]): Promise<SiteConfig> {
  const raw = await chatJson(messages);
  const first = siteConfigSchema.safeParse(normalize(raw));
  if (first.success) return first.data;

  const retry = await chatJson([
    ...messages,
    { role: "assistant", content: JSON.stringify(raw).slice(0, 6000) },
    {
      role: "user",
      content: `O JSON anterior é inválido. Erros: ${JSON.stringify(first.error.issues.slice(0, 8))}. Reenvie o JSON completo corrigido.`,
    },
  ]);
  const second = siteConfigSchema.safeParse(normalize(retry));
  if (second.success) return second.data;
  throw new AiError("Não conseguimos montar o site. Tente reformular o pedido.");
}

/** Conserta desvios comuns antes de validar. */
function normalize(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const value = { ...(raw as Record<string, unknown>) };
  if (value["site"] && typeof value["site"] === "object") return normalize(value["site"]);
  const sections = value["sections"];
  if (Array.isArray(sections)) {
    const used = new Set<string>();
    value["sections"] = sections
      .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
      .map((s, index) => {
        let id = String(s["id"] ?? s["type"] ?? `secao-${index}`).toLowerCase();
        while (used.has(id)) id = `${id}-${index}`;
        used.add(id);
        return { ...s, id, visible: s["visible"] !== false };
      });
  }
  return value;
}