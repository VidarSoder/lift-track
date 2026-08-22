"use client";

import { useEffect } from "react";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone,
    ) ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
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

  if (standalone) {
    // 100vh is the full chromeless screen. 100dvh / innerHeight are short
    // by the status-bar height and leave a toolbar-sized gap at the bottom.
    root.style.setProperty("--app-height", "100vh");
    return;
  }

  root.style.removeProperty("--app-height");
}

export function useAppFrame() {
  useEffect(() => {
    applyFrame();
    const vv = window.visualViewport;
    const resetScroll = () => {
      if (isStandalone()) window.scrollTo(0, 0);
    };
    window.addEventListener("resize", applyFrame);
    window.addEventListener("orientationchange", applyFrame);
    window.addEventListener("focusin", resetScroll);
    window.addEventListener("focusout", resetScroll);
    vv?.addEventListener("resize", applyFrame);
    vv?.addEventListener("scroll", resetScroll);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", applyFrame);
    return () => {
      window.removeEventListener("resize", applyFrame);
      window.removeEventListener("orientationchange", applyFrame);
      window.removeEventListener("focusin", resetScroll);
      window.removeEventListener("focusout", resetScroll);
      vv?.removeEventListener("resize", applyFrame);
      vv?.removeEventListener("scroll", resetScroll);
      mq.removeEventListener?.("change", applyFrame);
    };
  }, []);
}
