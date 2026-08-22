import { useEffect, type RefObject } from "react";

export function useViewportShell(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const apply = () => {
      const vv = window.visualViewport;
      const top = vv?.offsetTop ?? 0;
      const height = Math.round(vv?.height ?? window.innerHeight);
      node.style.position = "fixed";
      node.style.left = "0";
      node.style.right = "0";
      node.style.top = `${top}px`;
      node.style.height = `${height}px`;
      node.style.bottom = "auto";
    };

    apply();
    window.visualViewport?.addEventListener("resize", apply);
    window.visualViewport?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      window.visualViewport?.removeEventListener("resize", apply);
      window.visualViewport?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, [ref]);
}
