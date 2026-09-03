import type { SiteTheme } from "@/types/site";

const RADIUS: Record<SiteTheme["borderRadius"], string> = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "14px",
  xl: "24px",
};

const SPACING: Record<SiteTheme["spacing"], string> = {
  compact: "48px",
  normal: "80px",
  spacious: "120px",
};

const FONTS: Record<SiteTheme["font"], string> = {
  sans: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
  display: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  serif: '"Instrument Serif", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

export function themeVars(theme: SiteTheme): React.CSSProperties {
  return {
    ["--s-primary" as string]: theme.primaryColor,
    ["--s-secondary" as string]: theme.secondaryColor,
    ["--s-bg" as string]: theme.backgroundColor,
    ["--s-text" as string]: theme.textColor,
    ["--s-radius" as string]: RADIUS[theme.borderRadius],
    ["--s-gap" as string]: SPACING[theme.spacing],
    ["--s-font" as string]: FONTS[theme.font],
    ["--s-muted" as string]: withAlpha(theme.textColor, 0.66),
    ["--s-line" as string]: withAlpha(theme.textColor, 0.12),
    ["--s-tint" as string]: withAlpha(theme.primaryColor, 0.08),
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: FONTS[theme.font],
  };
}

export function withAlpha(hexColor: string, alpha: number): string {
  const clean = hexColor.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.slice(0, 6);
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int)) return `rgba(17,24,39,${alpha})`;
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Contraste simples para saber se o texto sobre a cor primária deve ser claro ou escuro. */
export function readableOn(hexColor: string): string {
  const clean = hexColor.replace("#", "").slice(0, 6).padEnd(6, "0");
  const int = Number.parseInt(clean, 16);
  if (Number.isNaN(int)) return "#ffffff";
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#111827" : "#ffffff";
}

/** Nunca renderiza javascript: ou data: vindos da IA / do usuário. */
export function safeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const value = url.trim();
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(value)) return value;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(value)) return `https://${value}`;
  return undefined;
}

export function whatsappUrl(number?: string): string | undefined {
  if (!number) return undefined;
  const digits = number.replace(/\D/g, "");
  if (digits.length < 8) return undefined;
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
}