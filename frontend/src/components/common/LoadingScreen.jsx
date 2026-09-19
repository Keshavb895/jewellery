import React, { useState, useEffect } from "react";
import { Diamond, ArrowRight } from "lucide-react";
import "./LoadingScreen.css";

export function LoadingScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [statusPhrase, setStatusPhrase] = useState("Selecting Rare Alloys");

  useEffect(() => {
    // Smooth luxury progress animation extended by ~1 second
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        // Finer increments for a smoother, 1-second longer experience
        const step = Math.floor(Math.random() * 4) + 2;
        const next = Math.min(prev + step, 100);

        if (next < 28) {
          setStatusPhrase("Selecting Rare Alloys");
        } else if (next < 58) {
          setStatusPhrase("Setting Flawless Solitaires");
        } else if (next < 84) {
          setStatusPhrase("Polishing Vermeil Silhouettes...");
        } else if (next < 100) {
          setStatusPhrase("Curating Haute Edits...");
        } else {
          setStatusPhrase("Welcome to Flash Jewels");
        }

        return next;
      });
    }, 62);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
        const finishTimer = setTimeout(() => {
          if (onFinish) onFinish();
        }, 850);
        return () => clearTimeout(finishTimer);
      }, 650);

      return () => clearTimeout(exitTimer);
    }
  }, [progress, onFinish]);

  const handleSkip = () => {
    setProgress(100);
    setIsExiting(true);
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 400);
  };

  return (
    <aside
      aria-label="Flash Jewels Atelier Loading Screen"
      className={`luxury-splash-overlay ${isExiting ? "splash-exit" : ""}`}
    >
      {/* Radiant Glow Behind Centerpiece */}
      <div className="splash-ambient-glow" />

      {/* Floating Starlight Sparkles */}
      <div className="splash-sparkle s1">&#10022;</div>
      <div className="splash-sparkle s2">&#10022;</div>
      <div className="splash-sparkle s3">&#10022;</div>
      <div className="splash-sparkle s4">&#10022;</div>

      {/* Skip Button */}
      <button
        type="button"
        className="splash-skip-btn"
        onClick={handleSkip}
        aria-label="Skip introduction and enter site"
      >
        <span>Enter Atelier</span>
        <ArrowRight size={13} />
      </button>

      {/* Center Stage Content */}
      <div className="splash-content">
        {/* Animated Jewelry Emblem */}
        <div className="splash-crest-wrapper">
          {/* Outer Celestial Orbiting Ring */}
          <svg
            className="splash-celestial-ring"
            viewBox="0 0 140 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="70"
              cy="70"
              r="66"
              stroke="#cbb279"
              strokeWidth="1"
              strokeDasharray="4 8"
              opacity="0.65"
            />
            <circle
              cx="70"
              cy="70"
              r="58"
              stroke="#e8d3a7"
              strokeWidth="0.75"
              opacity="0.35"
            />
            <circle cx="70" cy="4" r="2.5" fill="#f8eed6" />
            <circle cx="70" cy="136" r="2.5" fill="#f8eed6" />
            <circle cx="4" cy="70" r="2.5" fill="#f8eed6" />
            <circle cx="136" cy="70" r="2.5" fill="#f8eed6" />
          </svg>

          {/* Inner Faceted Diamond Orbit */}
          <svg
            className="splash-inner-ring"
            viewBox="0 0 110 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="55,10 100,55 55,100 10,55"
              stroke="#daa520"
              strokeWidth="1"
              strokeDasharray="6 4"
              opacity="0.5"
            />
          </svg>

          {/* Center Solitaire Gem Emblem */}
          <div className="splash-gem-center">
            <Diamond size={34} strokeWidth={1.3} />
          </div>
        </div>

        {/* Brand Name Typography with Left-to-Right Entrance */}
        <h1 className="splash-brand-title">
          {"FLASH".split("").map((letter, index) => (
            <span
              key={index}
              className="splash-letter"
              style={{ animationDelay: `${0.15 + index * 0.08}s` }}
            >
              {letter}
            </span>
          ))}
        </h1>
        <p className="splash-brand-sub">
          <span>Haute Joaillerie</span>
          <span className="diamond-dot">&#9670;</span>
          <span>Est. 2024</span>
        </p>

        {/* Hairline Golden Progress Bar */}
        <div className="splash-progress-container">
          <div className="splash-progress-track">
            <div
              className="splash-progress-bar"
              style={{ width: `${progress}%` }}
            >
              <div className="splash-progress-tip" />
            </div>
          </div>
        </div>

        {/* Status Meta Row */}
        <div className="splash-meta-row">
          <span className="splash-status-phrase">{statusPhrase}</span>
          <span className="splash-percent-text">{progress}%</span>
        </div>
      </div>
    </aside>
  );
}
