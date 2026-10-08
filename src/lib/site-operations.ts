import { siteConfigSchema, type SiteConfig } from "@/types/site";

/** Operações estruturadas que o Assistente pode pedir. Aplicadas em código, nunca reescrevendo o site inteiro. */
export type SiteOperation =
  | { op: "set_theme"; changes: Record<string, unknown> }
  | { op: "set_business"; changes: Record<string, unknown> }
  | { op: "set_seo"; changes: Record<string, unknown> }
  | { op: "update_section"; sectionId: string; changes: Record<string, unknown> }
  | { op: "add_section"; section: Record<string, unknown>; afterId?: string }
  | { op: "remove_section"; sectionId: string }
  | { op: "move_section"; sectionId: string; afterId?: string | null }
  | { op: "update_item"; sectionId: string; itemId: string; changes: Record<string, unknown> }
  | { op: "add_item"; sectionId: string; item: Record<string, unknown> }
  | { op: "remove_item"; sectionId: string; itemId: string };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const PROTECTED = new Set(["id", "type"]);
const strip = (c: unknown): Obj =>
  isObj(c) ? Object.fromEntries(Object.entries(c).filter(([k]) => !PROTECTED.has(k))) : {};

export class OperationError extends Error {}

export function applyOperations(config: SiteConfig, ops: unknown[]): SiteConfig {
  const next = structuredClone(config) as unknown as Obj & { sections: Obj[] };
  const findSection = (id: unknown) => {
    const s = next.sections.find((x) => x["id"] === id);
    if (!s) throw new OperationError(`Seção "${String(id)}" não existe.`);
    return s;
  };
  const indexAfter = (afterId: unknown) => {
    if (afterId == null || afterId === "") return next.sections.length;
    const i = next.sections.findIndex((x) => x["id"] === afterId);
    return i < 0 ? next.sections.length : i + 1;
  };

  for (const raw of ops) {
    if (!isObj(raw)) continue;
    const op = raw as Obj;
    switch (op["op"]) {
      case "set_theme":
      case "set_business":
      case "set_seo": {
        const key = String(op["op"]).slice(4);
        next[key] = { ...(isObj(next[key]) ? next[key] : {}), ...strip(op["changes"]) };
        break;
      }
      case "update_section":
        Object.assign(findSection(op["sectionId"]), strip(op["changes"]));
        break;
      case "add_section": {
        const section = isObj(op["section"]) ? { ...op["section"] } : null;
        if (!section || !section["type"]) throw new OperationError("Seção nova sem tipo.");
        let id = String(section["id"] ?? section["type"]).toLowerCase();
        while (next.sections.some((x) => x["id"] === id)) id = `${id}-2`;
        section["id"] = id;
        next.sections.splice(indexAfter(op["afterId"]), 0, section);
        break;
      }
      case "remove_section":
        findSection(op["sectionId"]);
        next.sections = next.sections.filter((x) => x["id"] !== op["sectionId"]);
        break;
      case "move_section": {
        const s = findSection(op["sectionId"]);
        next.sections = next.sections.filter((x) => x !== s);
        next.sections.splice(indexAfter(op["afterId"]), 0, s);
        break;
      }
      case "update_item":
      case "add_item":
      case "remove_item": {
        const s = findSection(op["sectionId"]);
        const items = Array.isArray(s["items"]) ? (s["items"] as Obj[]) : [];
        if (op["op"] === "add_item") {
          if (!isObj(op["item"])) throw new OperationError("Item inválido.");
          const item = { ...op["item"] };
          let n = items.length + 1;
          while (items.some((x) => x["id"] === `${s["id"]}-item-${n}`)) n++;
          item["id"] = `${s["id"]}-item-${n}`;
          s["items"] = [...items, item];
        } else {
          const item = items.find((x) => x["id"] === op["itemId"]);
          if (!item) throw new OperationError(`Item "${String(op["itemId"])}" não existe.`);
          s["items"] =
            op["op"] === "remove_item"
              ? items.filter((x) => x !== item)
              : items.map((x) => (x === item ? { ...x, ...strip(op["changes"]) } : x));
        }
        break;
      }
      default:
        throw new OperationError(`Operação desconhecida: ${String(op["op"])}`);
    }
  }

  const parsed = siteConfigSchema.safeParse(next);
  if (!parsed.success) throw new OperationError("Resultado inválido: " + parsed.error.issues[0]?.message);
  return parsed.data;
}
