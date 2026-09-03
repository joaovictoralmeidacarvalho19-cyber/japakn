import { z } from "zod";

/** Estilos visuais disponíveis. */
export const VISUAL_STYLES = [
  "moderno",
  "minimalista",
  "elegante",
  "luxuoso",
  "criativo",
  "corporativo",
  "futurista",
] as const;

/** Nível de sofisticação da experiência gerada. */
export const EXPERIENCE_LEVELS = ["standard", "premium", "cinematic"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  standard: "Standard",
  premium: "Premium",
  cinematic: "Cinematic",
};

export const EXPERIENCE_DESCRIPTIONS: Record<ExperienceLevel, string> = {
  standard: "Design moderno, leve e rápido, com animações suaves.",
  premium: "Profundidade, parallax, gradientes e microinterações.",
  cinematic: "Experiência imersiva com cena 3D e animação por rolagem.",
};

/** Animações de entrada reutilizáveis. */
export const ANIMATIONS = ["none", "fade", "slide-up", "slide-left", "scale", "blur", "reveal"] as const;
export type AnimationName = (typeof ANIMATIONS)[number];

/** Objetos 3D disponíveis (propósito, nunca enfeite). */
export const THREE_OBJECTS = ["particles", "product", "vehicle", "architecture", "abstract"] as const;
export type ThreeObject = (typeof THREE_OBJECTS)[number];


export const CATEGORIES = [
  "Restaurante",
  "Barbearia",
  "Salão de beleza",
  "Academia",
  "Fotógrafo",
  "Loja",
  "Profissional autônomo",
  "Imobiliária",
  "Empresa",
  "Outro",
] as const;

export const GOALS = [
  "Receber mensagens",
  "Receber agendamentos",
  "Apresentar serviços",
  "Vender produtos",
  "Apresentar empresa",
] as const;

export const SECTION_TYPES = [
  "navbar",
  "hero",
  "about",
  "services",
  "pricing",
  "gallery",
  "testimonials",
  "faq",
  "contact",
  "location",
  "cta",
  "footer",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_LABELS: Record<SectionType, string> = {
  navbar: "Menu",
  hero: "Destaque",
  about: "Sobre",
  services: "Serviços",
  pricing: "Preços",
  gallery: "Galeria",
  testimonials: "Depoimentos",
  faq: "Perguntas frequentes",
  contact: "Contato",
  location: "Localização",
  cta: "Chamada final",
  footer: "Rodapé",
};

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{3,8}$/)
  .catch("#111827");

export const itemSchema = z.object({
  title: z.string().max(160).optional(),
  description: z.string().max(800).optional(),
  price: z.string().max(60).optional(),
  image: z.string().max(2000).optional(),
  icon: z.string().max(40).optional(),
  name: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  quote: z.string().max(800).optional(),
  question: z.string().max(300).optional(),
  answer: z.string().max(1200).optional(),
  label: z.string().max(120).optional(),
  url: z.string().max(2000).optional(),
  features: z.array(z.string().max(160)).max(12).optional(),
  highlighted: z.boolean().optional(),
});
export type SectionItem = z.infer<typeof itemSchema>;

export const sectionSchema = z.object({
  id: z.string().max(60),
  type: z.enum(SECTION_TYPES),
  visible: z.boolean().default(true),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(400).optional(),
  description: z.string().max(2000).optional(),
  buttonText: z.string().max(80).optional(),
  buttonUrl: z.string().max(2000).optional(),
  secondaryButtonText: z.string().max(80).optional(),
  secondaryButtonUrl: z.string().max(2000).optional(),
  image: z.string().max(2000).optional(),
  alignment: z.enum(["left", "center"]).optional(),
  items: z.array(itemSchema).max(24).optional(),
  phone: z.string().max(60).optional(),
  whatsapp: z.string().max(60).optional(),
  email: z.string().max(160).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  instagram: z.string().max(160).optional(),
  hours: z.string().max(300).optional(),
  mapQuery: z.string().max(300).optional(),
  /** Animação de entrada da seção. */
  animation: z.enum(ANIMATIONS).catch("fade").optional(),
  /** Variação de fundo da seção. */
  background: z.enum(["default", "tint", "contrast", "gradient"]).catch("default").optional(),
  /** Cena 3D opcional (usada apenas quando faz sentido para o negócio). */
  three: z
    .object({
      object: z.enum(THREE_OBJECTS).catch("abstract").default("abstract"),
      modelUrl: z.string().max(2000).optional(),
      scrollCamera: z.boolean().default(true),
      intensity: z.enum(["low", "medium", "high"]).catch("medium").default("medium"),
    })
    .optional(),
});
export type Section = z.infer<typeof sectionSchema>;

export const themeSchema = z.object({
  primaryColor: hex.default("#0f766e"),
  secondaryColor: hex.default("#111827"),
  backgroundColor: hex.default("#ffffff"),
  textColor: hex.default("#111827"),
  font: z.enum(["sans", "display", "serif", "mono"]).catch("sans").default("sans"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl"]).catch("lg").default("lg"),
  spacing: z.enum(["compact", "normal", "spacious"]).catch("normal").default("normal"),
  visualStyle: z.enum(VISUAL_STYLES).catch("moderno").default("moderno"),
  experience: z.enum(EXPERIENCE_LEVELS).catch("standard").default("standard"),
  animations: z.enum(["none", "subtle", "rich"]).catch("subtle").default("subtle"),
});

export type SiteTheme = z.infer<typeof themeSchema>;

export const businessSchema = z.object({
  name: z.string().max(160).default(""),
  category: z.string().max(80).optional(),
  description: z.string().max(2000).optional(),
  phone: z.string().max(60).optional(),
  whatsapp: z.string().max(60).optional(),
  email: z.string().max(160).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  instagram: z.string().max(160).optional(),
  hours: z.string().max(300).optional(),
  audience: z.string().max(300).optional(),
  goal: z.string().max(120).optional(),
});
export type Business = z.infer<typeof businessSchema>;

export const seoSchema = z.object({
  title: z.string().max(70).default(""),
  description: z.string().max(180).default(""),
  favicon: z.string().max(2000).optional(),
  shareImage: z.string().max(2000).optional(),
});

export const siteConfigSchema = z.object({
  version: z.literal(1).catch(1).default(1),
  business: businessSchema.default({ name: "" }),
  theme: themeSchema.default({}),
  seo: seoSchema.default({ title: "", description: "" }),
  sections: z.array(sectionSchema).min(1).max(20),
});
export type SiteConfig = z.infer<typeof siteConfigSchema>;

export function emptySiteConfig(name = "Meu site"): SiteConfig {
  return siteConfigSchema.parse({
    business: { name },
    theme: {},
    seo: { title: name, description: "" },
    sections: [
      { id: "navbar", type: "navbar", title: name, visible: true },
      {
        id: "hero",
        type: "hero",
        title: name,
        subtitle: "Seu site está sendo preparado.",
        buttonText: "Fale conosco",
        visible: true,
      },
      { id: "footer", type: "footer", title: name, visible: true },
    ],
  });
}

/** Nunca confia no que vem do banco ou da IA: valida e conserta. */
export function safeParseSiteConfig(value: unknown): SiteConfig | null {
  const parsed = siteConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function newSectionId(type: SectionType) {
  return `${type}-${Math.random().toString(36).slice(2, 8)}`;
}