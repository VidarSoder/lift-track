"use client";

import { useEffect } from "react";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone,
    )
  );
}

function screenHeight() {
  const portrait = window.innerWidth <= window.innerHeight;
  return portrait
    ? Math.max(screen.width, screen.height)
    : Math.min(screen.width, screen.height);
}

function applyFrame() {
  const root = document.documentElement;
  const standalone = isStandalone();
  root.classList.toggle("is-standalone", standalone);

  const vv = window.visualViewport;
  const keyboardOpen = Boolean(vv && window.innerHeight - vv.height > 80);

  if (keyboardOpen && vv) {
    root.style.setProperty(
      "--app-height",
      `${Math.round(vv.height + vv.offsetTop)}px`,
    );
    return;
  }

  if (!standalone) {
    root.style.removeProperty("--app-height");
    return;
  }

  const height = Math.max(
    window.innerHeight,
    document.documentElement.clientHeight,
    vv ? vv.height + vv.offsetTop : 0,
    screenHeight(),
  );
  root.style.setProperty("--app-height", `${Math.round(height)}px`);
}

export function useAppFrame() {
  useEffect(() => {
    applyFrame();
    const vv = window.visualViewport;
    window.addEventListener("resize", applyFrame);
    window.addEventListener("orientationchange", applyFrame);
    vv?.addEventListener("resize", applyFrame);
    vv?.addEventListener("scroll", applyFrame);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", applyFrame);
    return () => {
      window.removeEventListener("resize", applyFrame);
      window.removeEventListener("orientationchange", applyFrame);
      vv?.removeEventListener("resize", applyFrame);
      vv?.removeEventListener("scroll", applyFrame);
      mq.removeEventListener?.("change", applyFrame);
    };
  }, []);
}
