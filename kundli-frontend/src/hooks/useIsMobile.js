/**
 * useIsMobile.js
 * 
 * Usage:
 *   import { useIsMobile, useBreakpoint } from '../hooks/useIsMobile';
 *   const isMobile = useIsMobile();      // true if <768px
 *   const bp = useBreakpoint();          // 'mobile' | 'tablet' | 'desktop'
 * 
 * File location: src/hooks/useIsMobile.js
 */
import { useState, useEffect } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    if (typeof window === "undefined") return "desktop";
    if (window.innerWidth < 768)  return "mobile";
    if (window.innerWidth < 1024) return "tablet";
    return "desktop";
  });

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 768)  setBp("mobile");
      else if (window.innerWidth < 1024) setBp("tablet");
      else setBp("desktop");
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return bp;
}