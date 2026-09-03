import JSZip from "jszip";

/** Nome de arquivo seguro derivado de uma URL. */
function fileNameFor(url: string, index: number, contentType?: string) {
  let base = "asset";
  try {
    const u = new URL(url, window.location.origin);
    base = u.pathname.split("/").filter(Boolean).pop() || "asset";
  } catch {
    /* ignore */
  }
  base = base.split("?")[0]!.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-60) || "asset";
  if (!/\.[a-z0-9]{2,5}$/i.test(base)) {
    const ext = contentType?.includes("css")
      ? "css"
      : contentType?.includes("javascript")
        ? "js"
        : contentType?.includes("svg")
          ? "svg"
          : contentType?.includes("png")
            ? "png"
            : contentType?.includes("webp")
              ? "webp"
              : contentType?.includes("jpeg")
                ? "jpg"
                : "bin";
    base = `${base}.${ext}`;
  }
  return `${index}-${base}`;
}

type Ctx = {
  zip: JSZip;
  cache: Map<string, string | null>;
  counter: { n: number };
};

/** Baixa um recurso, guarda no ZIP e devolve o caminho relativo (ou null se falhar). */
async function fetchAsset(rawUrl: string, ctx: Ctx, depth = 0): Promise<string | null> {
  if (!rawUrl || rawUrl.startsWith("data:") || rawUrl.startsWith("#")) return null;
  let absolute: string;
  try {
    absolute = new URL(rawUrl, window.location.origin).href;
  } catch {
    return null;
  }
  if (ctx.cache.has(absolute)) return ctx.cache.get(absolute)!;
  ctx.cache.set(absolute, null);

  try {
    const res = await fetch(absolute);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    const name = fileNameFor(absolute, ctx.counter.n++, type);
    const path = `assets/${name}`;

    if (type.includes("text/css") && depth < 3) {
      let css = await res.text();
      const urls = [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1]!);
      for (const u of urls) {
        if (u.startsWith("data:")) continue;
        let child: string | null = null;
        try {
          child = await fetchAsset(new URL(u, absolute).href, ctx, depth + 1);
        } catch {
          child = null;
        }
        if (child) css = css.split(u).join(child.replace("assets/", ""));
      }
      ctx.zip.file(path, css);
    } else {
      ctx.zip.file(path, await res.blob());
    }

    ctx.cache.set(absolute, path);
    return path;
  } catch {
    return null;
  }
}

/** Gera um ZIP estático (HTML + CSS + imagens) do site publicado. */
export async function buildSiteZip(slug: string): Promise<Blob> {
  const res = await fetch(`/s/${slug}`);
  if (!res.ok) throw new Error("Não conseguimos carregar o site publicado.");
  const html = await res.text();

  const doc = new DOMParser().parseFromString(html, "text/html");
  const zip = new JSZip();
  const ctx: Ctx = { zip, cache: new Map(), counter: { n: 1 } };

  const targets: Array<[Element, string]> = [];
  doc.querySelectorAll("link[rel='stylesheet'][href], link[rel='icon'][href]").forEach((el) =>
    targets.push([el, "href"]),
  );
  doc.querySelectorAll("script[src]").forEach((el) => targets.push([el, "src"]));
  doc.querySelectorAll("img[src], source[src], video[poster]").forEach((el) => {
    targets.push([el, el.tagName === "VIDEO" ? "poster" : "src"]);
  });

  for (const [el, attr] of targets) {
    const value = el.getAttribute(attr);
    if (!value) continue;
    const path = await fetchAsset(value, ctx);
    if (path) el.setAttribute(attr, path);
  }

  // srcset e imagens de fundo inline
  for (const el of Array.from(doc.querySelectorAll("[srcset]"))) el.removeAttribute("srcset");
  for (const el of Array.from(doc.querySelectorAll<HTMLElement>("[style*='url(']"))) {
    const style = el.getAttribute("style") ?? "";
    let next = style;
    for (const m of style.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      const path = await fetchAsset(m[1]!, ctx);
      if (path) next = next.split(m[1]!).join(path);
    }
    el.setAttribute("style", next);
  }

  // Base absoluta não é necessária no pacote estático
  doc.querySelectorAll("base").forEach((el) => el.remove());

  zip.file("index.html", `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`);
  zip.file(
    "LEIA-ME.txt",
    [
      "Site exportado pela Japakn.",
      "",
      "Como hospedar:",
      "1. Descompacte esta pasta.",
      "2. Envie todos os arquivos (index.html + pasta assets) para sua hospedagem.",
      "3. Abra index.html no navegador para conferir localmente.",
    ].join("\n"),
  );

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
