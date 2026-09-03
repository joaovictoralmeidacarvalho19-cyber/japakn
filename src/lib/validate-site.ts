import type { SiteConfig } from "@/types/site";

export type SiteIssue = { level: "error" | "warning"; message: string };

/** Checagem antes de publicar: nada de site quebrado ou sem contato no ar. */
export function validateSite(config: SiteConfig): SiteIssue[] {
  const issues: SiteIssue[] = [];
  const visible = config.sections.filter((s) => s.visible !== false);

  if (!config.business.name.trim()) issues.push({ level: "error", message: "Informe o nome do negócio." });
  if (!visible.some((s) => s.type === "hero"))
    issues.push({ level: "error", message: "Seu site precisa de uma seção de destaque (hero)." });

  const b = config.business;
  const hasContact = Boolean(
    b.phone || b.whatsapp || b.email || visible.some((s) => s.phone || s.whatsapp || s.email),
  );
  if (!hasContact)
    issues.push({ level: "error", message: "Adicione pelo menos uma forma de contato (WhatsApp, telefone ou e-mail)." });

  if (!config.seo.title.trim()) issues.push({ level: "warning", message: "Defina um título para aparecer no Google." });
  if (!config.seo.description.trim())
    issues.push({ level: "warning", message: "Defina uma descrição curta para buscadores e redes sociais." });

  const emptyText = visible.filter(
    (s) => !["navbar", "footer"].includes(s.type) && !s.title && !s.description && !(s.items?.length),
  );
  if (emptyText.length)
    issues.push({ level: "warning", message: `${emptyText.length} seção(ões) ainda estão sem conteúdo.` });

  const location = visible.find((s) => s.type === "location");
  if (location && !(location.address || b.address))
    issues.push({ level: "warning", message: "A seção de localização está sem endereço." });

  return issues;
}
