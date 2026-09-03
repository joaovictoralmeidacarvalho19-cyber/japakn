import { useEffect, useRef, useState } from "react";
import type { Section } from "@/types/site";
import { detectCapability, type Capability } from "./device";

type ThreeConfig = NonNullable<Section["three"]>;

const PARTICLE_COUNT: Record<Capability, Record<ThreeConfig["intensity"], number>> = {
  full: { low: 900, medium: 1800, high: 3200 },
  reduced: { low: 350, medium: 700, high: 1100 },
  none: { low: 0, medium: 0, high: 0 },
};

/**
 * Cena 3D modular e sob demanda:
 * - three.js só é baixado quando a cena entra na viewport;
 * - dispositivos fracos recebem versão reduzida;
 * - sem WebGL ou com prefers-reduced-motion, cai para um fundo visual leve.
 */
export function Scene3D({
  config,
  primary,
  secondary,
  className,
}: {
  config: ThreeConfig;
  primary: string;
  secondary: string;
  className?: string | undefined;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [capability, setCapability] = useState<Capability | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setCapability(detectCapability());
  }, []);

  useEffect(() => {
    const node = hostRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !capability || capability === "none") return;
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const THREE = await import("three");
      if (disposed || !host) return;

      const width = host.clientWidth || 600;
      const height = host.clientHeight || 400;

      const renderer = new THREE.WebGLRenderer({ antialias: capability === "full", alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, capability === "full" ? 2 : 1.4));
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0.4, 6);

      const primaryColor = new THREE.Color(primary);
      const secondaryColor = new THREE.Color(secondary);

      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const key = new THREE.DirectionalLight(primaryColor, 2.2);
      key.position.set(3, 4, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(secondaryColor, 1.4);
      rim.position.set(-4, -1, -3);
      scene.add(rim);

      const group = new THREE.Group();
      scene.add(group);

      const segments = capability === "full" ? 64 : 24;
      let geometry: import("three").BufferGeometry;
      switch (config.object) {
        case "vehicle":
          geometry = new THREE.CapsuleGeometry(1, 1.9, Math.max(4, segments / 6), segments);
          break;
        case "product":
          geometry = new THREE.CylinderGeometry(1.1, 1.1, 2.1, segments);
          break;
        case "architecture":
          geometry = new THREE.BoxGeometry(2.2, 2.2, 2.2, 2, 2, 2);
          break;
        case "particles":
          geometry = new THREE.SphereGeometry(1.4, segments / 2, segments / 2);
          break;
        default:
          geometry = new THREE.IcosahedronGeometry(1.6, capability === "full" ? 2 : 1);
      }

      const material = new THREE.MeshStandardMaterial({
        color: primaryColor,
        metalness: 0.75,
        roughness: 0.22,
        flatShading: config.object === "abstract",
      });
      const mesh = new THREE.Mesh(geometry, material);
      if (config.object === "vehicle") mesh.rotation.z = Math.PI / 2;
      if (config.object !== "particles") group.add(mesh);

      // Partículas — quantidade adaptada ao dispositivo.
      const count = PARTICLE_COUNT[capability][config.intensity];
      let points: import("three").Points | undefined;
      if (count > 0) {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 18;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
        }
        const pGeometry = new THREE.BufferGeometry();
        pGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        points = new THREE.Points(
          pGeometry,
          new THREE.PointsMaterial({ color: secondaryColor, size: 0.035, transparent: true, opacity: 0.7 }),
        );
        scene.add(points);
      }

      let pointer = { x: 0, y: 0 };
      const onPointer = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        pointer = {
          x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
        };
      };
      host.addEventListener("pointermove", onPointer);

      let scrollProgress = 0;
      const onScroll = () => {
        const rect = host.getBoundingClientRect();
        const total = rect.height + window.innerHeight;
        scrollProgress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / total));
      };
      if (config.scrollCamera) {
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      }

      const onResize = () => {
        const w = host.clientWidth || width;
        const h = host.clientHeight || height;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      window.addEventListener("resize", onResize);

      let raf = 0;
      let running = true;
      const onVisibility = () => {
        running = !document.hidden;
        if (running) raf = requestAnimationFrame(tick);
      };
      document.addEventListener("visibilitychange", onVisibility);

      const clock = new THREE.Clock();
      function tick() {
        if (!running) return;
        const t = clock.getElapsedTime();
        group.rotation.y += 0.0045;
        group.rotation.x = Math.sin(t * 0.4) * 0.12 + pointer.y * 0.12;
        group.position.y = Math.sin(t * 0.7) * 0.12;
        if (points) points.rotation.y = t * 0.02;
        // Câmera guiada pela rolagem: aproximação cinematográfica.
        const target = config.scrollCamera ? 6 - scrollProgress * 2.4 : 6;
        camera.position.z += (target - camera.position.z) * 0.06;
        camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.05;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        running = false;
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onScroll);
        host.removeEventListener("pointermove", onPointer);
        geometry.dispose();
        material.dispose();
        points?.geometry.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [visible, capability, config.object, config.intensity, config.scrollCamera, primary, secondary]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={className}
      style={{
        // Fallback visual elegante para dispositivos sem 3D (também aparece atrás da cena).
        background: `radial-gradient(120% 90% at 30% 20%, ${primary}33, transparent 60%), radial-gradient(100% 80% at 80% 80%, ${secondary}33, transparent 65%)`,
      }}
    />
  );
}
