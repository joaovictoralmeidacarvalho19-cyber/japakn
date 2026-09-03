import type { SiteConfig } from "@/types/site";
import { SectionRenderer } from "./sections";
import { readableOn, themeVars } from "./theme";

export function SiteRenderer({ config }: { config: SiteConfig }) {
  const style = {
    ...themeVars(config.theme),
    ["--s-on-primary" as string]: readableOn(config.theme.primaryColor),
  } as React.CSSProperties;

  return (
    <div style={style} className="min-h-full w-full">
      {config.sections
        .filter((section) => section.visible !== false)
        .map((section) => (
          <SectionRenderer key={section.id} section={section} config={config} />
        ))}
    </div>
  );
}