"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Interpola un número con easing para que las métricas del HUD "cuenten"
 * cuando cambia el escenario. Respeta prefers-reduced-motion.
 */
export function useAnimatedNumber(value: number, duration = 850): number {
  // Arranca en el valor real: si el primer frame de animación se retrasa (p. ej.
  // mientras Deck.gl compila shaders) el HUD nunca muestra un 0 engañoso.
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }

    const from = displayRef.current;
    if (Math.abs(from - value) < 0.01) return;

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (value - from) * eased;
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}
