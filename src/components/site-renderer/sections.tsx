import type { Section, SiteConfig } from "@/types/site";
import { readableOn, safeUrl, whatsappUrl, withAlpha } from "./theme";
import { Reveal } from "./Reveal";
import { Scene3D } from "./Scene3D";

type Props = { section: Section; config: SiteConfig };

const wrap = "mx-auto w-full max-w-6xl px-6 md:px-10";
const sectionPad = { paddingTop: "var(--s-gap)", paddingBottom: "var(--s-gap)" };


function PrimaryButton({
  children,
  href,
  outline,
}: {
  children: React.ReactNode;
  href?: string | undefined;
  outline?: boolean | undefined;
}) {
  const style: React.CSSProperties = outline
    ? {
        borderRadius: "var(--s-radius)",
        border: "1px solid var(--s-line)",
        color: "var(--s-text)",
      }
    : {
        borderRadius: "var(--s-radius)",
        backgroundColor: "var(--s-primary)",
        color: "var(--s-on-primary)",
      };
  return (
    <a
      href={safeUrl(href) ?? "#contato"}
      style={style}
      className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5"
    >
      {children}
    </a>
  );
}

function Heading({ title, subtitle }: { title?: string | undefined; subtitle?: string | undefined }) {
  if (!title && !subtitle) return null;
  return (
    <div className="mx-auto max-w-2xl text-center">
      {title ? <h2 className="text-3xl font-bold md:text-4xl">{title}</h2> : null}
      {subtitle ? (
        <p className="mt-3 text-base" style={{ color: "var(--s-muted)" }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function Placeholder({ label, className }: { label: string; className?: string | undefined }) {
  return (
    <div
      className={`flex items-center justify-center text-xs uppercase tracking-widest ${className ?? ""}`}
      style={{
        backgroundColor: "var(--s-tint)",
        color: "var(--s-muted)",
        borderRadius: "var(--s-radius)",
      }}
    >
      {label}
    </div>
  );
}

function Navbar({ section, config }: Props) {
  const links = config.sections
    .filter((s) => s.visible && !["navbar", "footer", "hero"].includes(s.type))
    .slice(0, 5);
  return (
    <header
      className="sticky top-0 z-20 backdrop-blur"
      style={{
        backgroundColor: withAlpha(config.theme.backgroundColor, 0.85),
        borderBottom: "1px solid var(--s-line)",
      }}
    >
      <div className={`${wrap} flex h-16 items-center justify-between gap-4`}>
        <div className="flex items-center gap-2 font-bold">
          {section.image ? (
            <img src={section.image} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "var(--s-primary)" }}
            />
          )}
          <span className="truncate">{section.title || config.business.name}</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm md:flex" style={{ color: "var(--s-muted)" }}>
          {links.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="transition-opacity hover:opacity-70">
              {l.title || l.type}
            </a>
          ))}
        </nav>
        {section.buttonText ? (
          <PrimaryButton href={section.buttonUrl}>{section.buttonText}</PrimaryButton>
        ) : null}
      </div>
    </header>
  );
}

function Hero({ section, config }: Props) {
  const centered = section.alignment !== "left";
  const scene = section.three;
  return (
    <section id={section.id} style={{ ...sectionPad, position: "relative", overflow: "hidden" }}>
      {scene ? (
        <Scene3D
          config={scene}
          primary={config.theme.primaryColor}
          secondary={config.theme.secondaryColor}
          className="pointer-events-none absolute inset-0 -z-10"
        />
      ) : null}
      <div className={`${wrap} relative grid items-center gap-12 ${centered ? "" : "md:grid-cols-2"}`}>

        <div className={centered ? "mx-auto max-w-3xl text-center" : ""}>
          <h1 className="text-4xl font-bold leading-[1.05] md:text-6xl">{section.title}</h1>
          {section.subtitle ? (
            <p className="mt-5 text-lg" style={{ color: "var(--s-muted)" }}>
              {section.subtitle}
            </p>
          ) : null}
          <div className={`mt-8 flex flex-wrap gap-3 ${centered ? "justify-center" : ""}`}>
            {section.buttonText ? (
              <PrimaryButton href={section.buttonUrl}>{section.buttonText}</PrimaryButton>
            ) : null}
            {section.secondaryButtonText ? (
              <PrimaryButton href={section.secondaryButtonUrl} outline>
                {section.secondaryButtonText}
              </PrimaryButton>
            ) : null}
          </div>
        </div>
        {!centered ? (
          section.image ? (
            <img
              src={section.image}
              alt={section.title ?? ""}
              className="h-72 w-full object-cover md:h-[26rem]"
              style={{ borderRadius: "var(--s-radius)" }}
            />
          ) : (
            <Placeholder label="Sua imagem aqui" className="h-72 w-full md:h-[26rem]" />
          )
        ) : null}
      </div>
      {centered && section.image ? (
        <div className={`${wrap} mt-12`}>
          <img
            src={section.image}
            alt=""
            className="h-72 w-full object-cover md:h-[28rem]"
            style={{ borderRadius: "var(--s-radius)" }}
          />
        </div>
      ) : null}
    </section>
  );
}

function About({ section }: Props) {
  return (
    <section id={section.id} style={sectionPad}>
      <div className={`${wrap} grid items-center gap-10 md:grid-cols-2`}>
        {section.image ? (
          <img
            src={section.image}
            alt=""
            className="h-72 w-full object-cover md:h-96"
            style={{ borderRadius: "var(--s-radius)" }}
          />
        ) : (
          <Placeholder label="Foto da empresa" className="h-72 w-full md:h-96" />
        )}
        <div>
          <h2 className="text-3xl font-bold md:text-4xl">{section.title || "Sobre nós"}</h2>
          {section.description ? (
            <p className="mt-4 whitespace-pre-line leading-relaxed" style={{ color: "var(--s-muted)" }}>
              {section.description}
            </p>
          ) : null}
          {section.buttonText ? (
            <div className="mt-7">
              <PrimaryButton href={section.buttonUrl}>{section.buttonText}</PrimaryButton>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Services({ section }: Props) {
  return (
    <section id={section.id} style={{ ...sectionPad, backgroundColor: "var(--s-tint)" }}>
      <div className={wrap}>
        <Heading title={section.title || "Serviços"} subtitle={section.description} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(section.items ?? []).map((item, i) => (
            <div
              key={i}
              className="p-6 transition-transform duration-200 hover:-translate-y-1"
              style={{
                backgroundColor: "var(--s-bg)",
                borderRadius: "var(--s-radius)",
                border: "1px solid var(--s-line)",
              }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  className="mb-4 h-36 w-full object-cover"
                  style={{ borderRadius: "var(--s-radius)" }}
                />
              ) : null}
              <h3 className="text-lg font-semibold">{item.title}</h3>
              {item.description ? (
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--s-muted)" }}>
                  {item.description}
                </p>
              ) : null}
              {item.price ? (
                <p className="mt-4 font-semibold" style={{ color: "var(--s-primary)" }}>
                  {item.price}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ section }: Props) {
  return (
    <section id={section.id} style={sectionPad}>
      <div className={wrap}>
        <Heading title={section.title || "Planos e preços"} subtitle={section.description} />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {(section.items ?? []).map((item, i) => (
            <div
              key={i}
              className="flex flex-col p-7"
              style={{
                borderRadius: "var(--s-radius)",
                border: item.highlighted ? "2px solid var(--s-primary)" : "1px solid var(--s-line)",
              }}
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-3xl font-bold">{item.price}</p>
              {item.description ? (
                <p className="mt-2 text-sm" style={{ color: "var(--s-muted)" }}>
                  {item.description}
                </p>
              ) : null}
              <ul className="mt-5 flex-1 space-y-2 text-sm" style={{ color: "var(--s-muted)" }}>
                {(item.features ?? []).map((f, j) => (
                  <li key={j}>• {f}</li>
                ))}
              </ul>
              <div className="mt-6">
                <PrimaryButton href={item.url} outline={!item.highlighted}>
                  {item.label || section.buttonText || "Quero este"}
                </PrimaryButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery({ section }: Props) {
  const items = section.items?.length ? section.items : [{}, {}, {}, {}, {}, {}];
  return (
    <section id={section.id} style={sectionPad}>
      <div className={wrap}>
        <Heading title={section.title || "Galeria"} subtitle={section.description} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 9).map((item, i) =>
            item.image ? (
              <img
                key={i}
                src={item.image}
                alt={item.title ?? ""}
                className="h-56 w-full object-cover"
                style={{ borderRadius: "var(--s-radius)" }}
              />
            ) : (
              <Placeholder key={i} label="Foto" className="h-56 w-full" />
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ section }: Props) {
  return (
    <section id={section.id} style={{ ...sectionPad, backgroundColor: "var(--s-tint)" }}>
      <div className={wrap}>
        <Heading title={section.title || "Depoimentos"} subtitle={section.description} />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {(section.items ?? []).map((item, i) => (
            <figure
              key={i}
              className="p-6"
              style={{
                backgroundColor: "var(--s-bg)",
                borderRadius: "var(--s-radius)",
                border: "1px solid var(--s-line)",
              }}
            >
              <blockquote className="leading-relaxed">“{item.quote || item.description}”</blockquote>
              <figcaption className="mt-4 text-sm font-semibold">
                {item.name}
                {item.role ? (
                  <span className="block font-normal" style={{ color: "var(--s-muted)" }}>
                    {item.role}
                  </span>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ section }: Props) {
  return (
    <section id={section.id} style={sectionPad}>
      <div className={wrap}>
        <Heading title={section.title || "Perguntas frequentes"} subtitle={section.description} />
        <div className="mx-auto mt-10 max-w-3xl">
          {(section.items ?? []).map((item, i) => (
            <details key={i} className="py-4" style={{ borderBottom: "1px solid var(--s-line)" }}>
              <summary className="cursor-pointer font-semibold">{item.question || item.title}</summary>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--s-muted)" }}>
                {item.answer || item.description}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ section, config }: Props) {
  const b = config.business;
  const phone = section.phone || b.phone;
  const zap = whatsappUrl(section.whatsapp || b.whatsapp);
  const email = section.email || b.email;
  const instagram = section.instagram || b.instagram;
  const rows = [
    phone ? { label: "Telefone", value: phone, href: `tel:${phone.replace(/\D/g, "")}` } : null,
    zap ? { label: "WhatsApp", value: section.whatsapp || b.whatsapp || "", href: zap } : null,
    email ? { label: "E-mail", value: email, href: `mailto:${email}` } : null,
    instagram
      ? {
          label: "Instagram",
          value: instagram,
          href: `https://instagram.com/${instagram.replace(/^@/, "")}`,
        }
      : null,
  ].filter(Boolean) as { label: string; value: string; href: string }[];

  return (
    <section id={section.id || "contato"} style={sectionPad}>
      <div className={wrap}>
        <Heading title={section.title || "Fale com a gente"} subtitle={section.description} />
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <a
              key={row.label}
              href={row.href}
              className="p-5 transition-transform duration-200 hover:-translate-y-0.5"
              style={{ borderRadius: "var(--s-radius)", border: "1px solid var(--s-line)" }}
            >
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--s-muted)" }}>
                {row.label}
              </span>
              <span className="mt-1 block font-semibold">{row.value}</span>
            </a>
          ))}
        </div>
        {section.buttonText ? (
          <div className="mt-8 text-center">
            <PrimaryButton href={section.buttonUrl ?? zap}>{section.buttonText}</PrimaryButton>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LocationSection({ section, config }: Props) {
  const address = section.address || config.business.address;
  const city = section.city || config.business.city;
  const query = encodeURIComponent(section.mapQuery || [address, city].filter(Boolean).join(", "));
  return (
    <section id={section.id} style={{ ...sectionPad, backgroundColor: "var(--s-tint)" }}>
      <div className={`${wrap} grid items-center gap-8 md:grid-cols-2`}>
        <div>
          <h2 className="text-3xl font-bold md:text-4xl">{section.title || "Onde estamos"}</h2>
          {address ? <p className="mt-4 font-medium">{address}</p> : null}
          {city ? (
            <p style={{ color: "var(--s-muted)" }}>{city}</p>
          ) : null}
          {(section.hours || config.business.hours) ? (
            <p className="mt-4 whitespace-pre-line text-sm" style={{ color: "var(--s-muted)" }}>
              {section.hours || config.business.hours}
            </p>
          ) : null}
        </div>
        {query ? (
          <iframe
            title="Mapa"
            src={`https://www.google.com/maps?q=${query}&output=embed`}
            className="h-72 w-full border-0"
            style={{ borderRadius: "var(--s-radius)" }}
            loading="lazy"
          />
        ) : (
          <Placeholder label="Endereço não informado" className="h-72 w-full" />
        )}
      </div>
    </section>
  );
}

function Cta({ section }: Props) {
  return (
    <section id={section.id} style={sectionPad}>
      <div className={wrap}>
        <div
          className="px-8 py-14 text-center"
          style={{
            backgroundColor: "var(--s-primary)",
            color: "var(--s-on-primary)",
            borderRadius: "var(--s-radius)",
          }}
        >
          <h2 className="text-3xl font-bold md:text-4xl">{section.title}</h2>
          {section.description ? <p className="mx-auto mt-3 max-w-xl opacity-90">{section.description}</p> : null}
          {section.buttonText ? (
            <a
              href={safeUrl(section.buttonUrl) ?? "#contato"}
              className="mt-8 inline-flex items-center justify-center px-7 py-3 text-sm font-semibold"
              style={{
                borderRadius: "var(--s-radius)",
                backgroundColor: "var(--s-bg)",
                color: "var(--s-text)",
              }}
            >
              {section.buttonText}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Footer({ section, config }: Props) {
  return (
    <footer style={{ borderTop: "1px solid var(--s-line)" }}>
      <div className={`${wrap} flex flex-col gap-2 py-10 text-sm md:flex-row md:items-center md:justify-between`}>
        <span className="font-semibold">{section.title || config.business.name}</span>
        <span style={{ color: "var(--s-muted)" }}>
          {section.description || `© ${new Date().getFullYear()} ${config.business.name}. Todos os direitos reservados.`}
        </span>
      </div>
    </footer>
  );
}

const MAP: Record<Section["type"], (p: Props) => React.ReactElement> = {
  navbar: Navbar,
  hero: Hero,
  about: About,
  services: Services,
  pricing: Pricing,
  gallery: Gallery,
  testimonials: Testimonials,
  faq: Faq,
  contact: Contact,
  location: LocationSection,
  cta: Cta,
  footer: Footer,
};

/** Variações de fundo por seção, sempre derivadas do tema (nunca cores fixas). */
function backgroundStyle(section: Section, config: SiteConfig): React.CSSProperties {
  switch (section.background) {
    case "tint":
      return { backgroundColor: "var(--s-tint)" };
    case "contrast":
      return {
        backgroundColor: config.theme.secondaryColor,
        color: readableOn(config.theme.secondaryColor),
      };
    case "gradient":
      return {
        backgroundImage: `linear-gradient(160deg, ${withAlpha(config.theme.primaryColor, 0.16)}, ${withAlpha(
          config.theme.secondaryColor,
          0.06,
        )})`,
      };
    default:
      return {};
  }
}

export function SectionRenderer({ section, config }: Props) {
  const Component = MAP[section.type];
  if (!Component) return null;

  const rich = config.theme.animations !== "none" && section.type !== "navbar";
  const animation = !rich ? "none" : (section.animation ?? (config.theme.animations === "rich" ? "reveal" : "fade"));
  const background = backgroundStyle(section, config);
  const inner = <Component section={section} config={config} />;

  if (section.type === "navbar" || (animation === "none" && !section.background)) return inner;

  return (
    <Reveal animation={animation} style={background}>
      {inner}
    </Reveal>
  );
}


export { readableOn };