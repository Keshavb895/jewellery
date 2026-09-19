import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function ScrollObserver() {
  const location = useLocation();
  const [scrollProgress, setScrollProgress] = useState(0);

  // Hairline luxury gold scroll progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const current = window.scrollY;
        setScrollProgress(Math.min(100, Math.max(0, (current / totalHeight) * 100)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  // High-performance IntersectionObserver for scroll-reveal animations
  useEffect(() => {
    // Slight delay to allow newly rendered route components to mount into DOM
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");

              // If it's a stagger container, assign stagger index and mark children revealed
              if (
                entry.target.classList.contains("reveal-stagger") ||
                entry.target.dataset.reveal === "stagger"
              ) {
                const children = Array.from(entry.target.children);
                children.forEach((child, index) => {
                  child.style.setProperty("--stagger-index", index);
                  child.classList.add("is-revealed");
                });
              }

              obs.unobserve(entry.target);
            }
          });
        },
        {
          root: null,
          rootMargin: "0px 0px -40px 0px",
          threshold: 0.08,
        }
      );

      // Query all elements targeted for scroll animation
      const selector = ".reveal, .reveal-up, .reveal-fade, .reveal-scale, .reveal-stagger, [data-reveal]";
      const elements = document.querySelectorAll(selector);

      elements.forEach((el) => {
        // Pre-assign stagger index to children for staggered grids
        if (
          el.classList.contains("reveal-stagger") ||
          el.dataset.reveal === "stagger"
        ) {
          Array.from(el.children).forEach((child, idx) => {
            child.style.setProperty("--stagger-index", idx);
          });
        }

        if (!el.classList.contains("is-revealed")) {
          observer.observe(el);
        }
      });

      return () => {
        observer.disconnect();
      };
    }, 60);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <div
      className="scroll-progress-indicator"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "2.5px",
        width: `${scrollProgress}%`,
        background: "linear-gradient(90deg, #8a6d2b 0%, #e6ca65 50%, #b8860b 100%)",
        zIndex: 9999,
        pointerEvents: "none",
        transition: "width 0.12s cubic-bezier(0.22, 1, 0.36, 1)",
        boxShadow: "0 0 10px rgba(223, 192, 114, 0.6)",
      }}
      aria-hidden="true"
    />
  );
}
