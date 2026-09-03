/** Detecção de capacidade do dispositivo para decidir o nível de 3D. */
export type Capability = "full" | "reduced" | "none";

export function detectCapability(): Capability {
  if (typeof window === "undefined") return "none";
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "none";

  // WebGL disponível?
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return "none";
  } catch {
    return "none";
  }

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return "none";

  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const smallScreen = window.innerWidth < 900;

  if (cores <= 4 || memory <= 4) return smallScreen ? "reduced" : "reduced";
  return smallScreen ? "reduced" : "full";
}
