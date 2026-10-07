"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const clamp = (value: number, low = 0, high = 1) =>
  Math.min(high, Math.max(low, value));

/** Progressive motion: server-rendered content stays usable without this enhancement. */
export function MotionSystem() {
  const path = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    const main = document.getElementById("main");
    if (!main) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let cleanup = () => {};

    function setup() {
      cleanup();
      root.dataset.motion = preference.matches ? "reduced" : "full";
      if (preference.matches) return;
      const parallax = Array.from(
        main!.querySelectorAll<HTMLElement>("[data-parallax]"),
      );
      const expanding = Array.from(
        main!.querySelectorAll<HTMLElement>("[data-expand]"),
      );
      const chapters = Array.from(
        main!.querySelectorAll<HTMLElement>("[data-chapter]"),
      );
      const chapterLinks = Array.from(
        main!.querySelectorAll<HTMLAnchorElement>("[data-chapter-link]"),
      );
      const reveals = Array.from(
        main!.querySelectorAll<HTMLElement>(
          "[data-reveal], .page-section > h1, .page-intro, .section-heading, .services article, .post-card, .contact-banner > *, .project-intro > *",
        ),
      );
      const pending = new Set<HTMLElement>();
      const reveal = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            el.classList.remove("motion-pending");
            el.classList.add("motion-visible");
            pending.delete(el);
            reveal.unobserve(el);
          }
        },
        { threshold: 0, rootMargin: "0px 0px -24px 0px" },
      );
      for (const el of reveals) {
        // Above-the-fold content never waits for a visibility callback.
        if (el.getBoundingClientRect().top < window.innerHeight - 24) continue;
        el.classList.add("motion-pending");
        pending.add(el);
        reveal.observe(el);
      }
      const focusReveal = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        for (const el of pending) {
          if (el === target || el.contains(target)) {
            el.classList.remove("motion-pending");
            pending.delete(el);
            reveal.unobserve(el);
          }
        }
      };
      main!.addEventListener("focusin", focusReveal);
      let frame = 0;
      const update = () => {
        frame = 0;
        const height = window.innerHeight;
        const mobile = window.innerWidth < 760;
        const scrollRange = Math.max(1, root.scrollHeight - height);
        // Read all geometry before writing to avoid layout thrashing.
        const scenes = parallax.map((el) => ({
          el,
          rect: el.getBoundingClientRect(),
          speed: Number(el.dataset.speed || 0.12),
        }));
        const expansions = expanding.map((el) => ({
          el,
          rect: el.getBoundingClientRect(),
        }));
        const positions = chapters.map((el) => ({
          el,
          top: el.getBoundingClientRect().top,
        }));
        root.style.setProperty(
          "--page-progress",
          String(clamp(window.scrollY / scrollRange)),
        );
        for (const { el, rect, speed } of scenes) {
          if (rect.bottom < -height || rect.top > height * 2) continue;
          const offset =
            el.dataset.parallax === "hero"
              ? -rect.top
              : height * 0.55 - (rect.top + rect.height * 0.5);
          el.style.setProperty(
            "--scroll-shift",
            `${clamp(offset * speed * (mobile ? 0.35 : 1), -100, 100).toFixed(2)}px`,
          );
        }
        for (const { el, rect } of expansions) {
          const progress = clamp((height - rect.top) / (height * 0.7));
          el.style.setProperty(
            "--scene-progress",
            String(mobile ? 1 : progress),
          );
        }
        const active =
          positions.filter(({ top }) => top <= height * 0.55).at(-1)?.el.id ||
          positions[0]?.el.id;
        for (const link of chapterLinks) {
          if (link.hash === `#${active}`)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        }
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      const resize = new ResizeObserver(schedule);
      resize.observe(main!);
      schedule();

      const depths = Array.from(
        main!.querySelectorAll<HTMLElement>("[data-depth]"),
      );
      const pointerCleanups = depths.map((el) => {
        let pointerFrame = 0;
        let x = 0,
          y = 0;
        const reset = () => {
          cancelAnimationFrame(pointerFrame);
          pointerFrame = 0;
          el.style.removeProperty("--depth-x");
          el.style.removeProperty("--depth-y");
          el.style.removeProperty("--light-x");
          el.style.removeProperty("--light-y");
          el.removeAttribute("data-pointer-active");
        };
        const move = (event: PointerEvent) => {
          if (!finePointer.matches || event.pointerType === "touch") return;
          const bounds = el.getBoundingClientRect();
          x = clamp((event.clientX - bounds.left) / bounds.width);
          y = clamp((event.clientY - bounds.top) / bounds.height);
          if (pointerFrame) return;
          pointerFrame = requestAnimationFrame(() => {
            pointerFrame = 0;
            el.style.setProperty(
              "--depth-x",
              `${((0.5 - y) * 4).toFixed(2)}deg`,
            );
            el.style.setProperty(
              "--depth-y",
              `${((x - 0.5) * 4).toFixed(2)}deg`,
            );
            el.style.setProperty("--light-x", `${(x * 100).toFixed(1)}%`);
            el.style.setProperty("--light-y", `${(y * 100).toFixed(1)}%`);
            el.setAttribute("data-pointer-active", "true");
          });
        };
        el.addEventListener("pointermove", move, { passive: true });
        el.addEventListener("pointerleave", reset);
        finePointer.addEventListener("change", reset);
        return () => {
          reset();
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", reset);
          finePointer.removeEventListener("change", reset);
        };
      });
      cleanup = () => {
        cancelAnimationFrame(frame);
        reveal.disconnect();
        resize.disconnect();
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        main!.removeEventListener("focusin", focusReveal);
        for (const el of reveals)
          el.classList.remove("motion-pending", "motion-visible");
        for (const el of parallax) el.style.removeProperty("--scroll-shift");
        for (const el of expanding) el.style.removeProperty("--scene-progress");
        for (const link of chapterLinks) link.removeAttribute("aria-current");
        root.style.removeProperty("--page-progress");
        pointerCleanups.forEach((fn) => fn());
      };
    }
    setup();
    preference.addEventListener("change", setup);
    return () => {
      cleanup();
      preference.removeEventListener("change", setup);
      delete root.dataset.motion;
    };
  }, [path]);
  return <div className="reading-progress" aria-hidden="true" />;
}
