"use client";
// Scroll effects for the landing page: reveals blocks as they arrive, feeds the parallax and the
// top progress bar. Renders nothing. Without JS the page stays fully visible (no .js class).

import { useEffect } from "react";

export default function LandingFx() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lp");
    if (!root) return;
    root.classList.add("js");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { root, threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = root.scrollHeight - root.clientHeight;
        root.style.setProperty("--sy", String(root.scrollTop));
        root.style.setProperty("--sp", String(max > 0 ? root.scrollTop / max : 0));
      });
    };
    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      root.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
