import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AnimationName } from "@/types/site";

/** Respeita prefers-reduced-motion em todo o sistema de animações. */
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const HIDDEN: Record<AnimationName, React.CSSProperties> = {
  none: {},
  fade: { opacity: 0 },
  "slide-up": { opacity: 0, transform: "translate3d(0,28px,0)" },
  "slide-left": { opacity: 0, transform: "translate3d(28px,0,0)" },
  scale: { opacity: 0, transform: "scale(0.96)" },
  blur: { opacity: 0, filter: "blur(12px)" },
  reveal: { opacity: 0, transform: "translate3d(0,40px,0)", filter: "blur(6px)" },
};

const SHOWN: React.CSSProperties = {
  opacity: 1,
  transform: "none",
  filter: "none",
};

type Props = {
  animation?: AnimationName | undefined;
  /** Atraso em cascata (stagger), em ms. */
  delay?: number | undefined;
  as?: "div" | "section" | "li" | "span";
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
  id?: string | undefined;
  children: React.ReactNode;
};

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Animação de entrada por scroll, leve (IntersectionObserver + CSS transitions). */
export function Reveal({ animation = "fade", delay = 0, as = "div", className, style, id, children }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useIsomorphicLayoutEffect(() => {
    if (animation === "none" || prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setState("shown");
      return;
    }
    setState("hidden");
  }, [animation]);

  useEffect(() => {
    if (state !== "hidden") return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState("shown");
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [state]);

  const Tag = as as React.ElementType;
  const animState: React.CSSProperties =
    state === "hidden" ? (HIDDEN[animation] ?? {}) : state === "shown" ? SHOWN : {};

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      style={{
        ...style,
        ...animState,
        transition:
          state === "idle" || animation === "none"
            ? undefined
            : `opacity 700ms cubic-bezier(.22,.61,.36,1) ${delay}ms, transform 700ms cubic-bezier(.22,.61,.36,1) ${delay}ms, filter 700ms ease ${delay}ms`,
        willChange: state === "hidden" ? "opacity, transform" : undefined,
      }}
    >
      {children}
    </Tag>
  );
}
