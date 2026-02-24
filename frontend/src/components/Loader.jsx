import React, { useEffect, useState } from "react";

const LETTERS_APEX = ["A", "P", "E", "X"];
const LETTERS_LEARNING = ["L", "E", "A", "R", "N", "I", "N", "G"];

const APEX_BASE_DELAY = 200;
const LEARNING_BASE_DELAY = 600;
const LETTER_STAGGER = 100;

const VISIBLE_DURATION = 3000; 
const FADE_DURATION = 800;      

export default function Loader({ children }) {
  const [phase, setPhase] = useState("loading"); // "loading" | "fading" | "done"

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase("fading"), VISIBLE_DURATION);
    const doneTimer = setTimeout(
      () => setPhase("done"),
      VISIBLE_DURATION + FADE_DURATION
    );
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <>
      {/* The Loader Overlay 
          We keep it in the DOM until phase is "done" 
      */}
      {phase !== "done" && (
        <div
          aria-label="Loading Apex Learning"
          role="status"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999, // Ensure it is above everything
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#030712", // Deep dark background
            transition: `opacity ${FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            opacity: phase === "fading" ? 0 : 1,
            pointerEvents: phase === "loading" ? "auto" : "none",
          }}
        >
          <style>{css}</style>

          <div className="apex-glow" />
          <div className="apex-scan" />

          <div className="apex-wordmark-row">
            <div className="apex-word">
              {LETTERS_APEX.map((char, i) => (
                <span
                  key={i}
                  className="apex-letter apex-letter--main"
                  style={{
                    animationDelay: `${APEX_BASE_DELAY + i * LETTER_STAGGER}ms`,
                  }}
                >
                  {char}
                </span>
              ))}
            </div>

            <div className="apex-word-spacer" />

            <div className="apex-word">
              {LETTERS_LEARNING.map((char, i) => (
                <span
                  key={i}
                  className="apex-letter apex-letter--sub"
                  style={{
                    animationDelay: `${LEARNING_BASE_DELAY + i * LETTER_STAGGER}ms`,
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          <div className="apex-bar-track">
            <div className="apex-bar-fill" />
          </div>

          <p className="apex-tagline">Preparing your learning experience…</p>
        </div>
      )}

      {/* Main App Content 
          Rendered immediately so it can load in the background, 
          preventing the white flash when the loader disappears.
      */}
      {children}
    </>
  );
}

const css = `
  .apex-glow {
    position: absolute;
    width: 800px;
    height: 400px;
    background: radial-gradient(
      circle at center,
      rgba(59, 130, 246, 0.12) 0%,
      transparent 70%
    );
    pointer-events: none;
    animation: apexGlowPulse 4s ease-in-out infinite;
  }

  @keyframes apexGlowPulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.2); opacity: 0.8; }
  }

  .apex-scan {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.03), transparent);
    background-size: 100% 20%;
    animation: apexScan 3s linear infinite;
    pointer-events: none;
  }

  @keyframes apexScan {
    from { background-position: 0 -100%; }
    to { background-position: 0 200%; }
  }

  .apex-wordmark-row {
    display: flex;
    align-items: baseline;
    justify-content: center;
    position: relative;
    z-index: 10;
  }

  .apex-word { display: flex; }
  .apex-word-spacer { width: 0.5em; }

  .apex-letter {
    display: inline-block;
    opacity: 0;
    transform: translateY(10px);
    filter: blur(5px);
    animation: apexLetterIn 1.2s cubic-bezier(0.2, 0, 0.2, 1) forwards;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: -0.02em;
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .apex-letter--main {
    font-size: clamp(2.5rem, 8vw, 5rem);
    background-image: linear-gradient(90deg, #ffffff, #94a3b8, #ffffff);
    animation: 
        apexLetterIn 1.2s cubic-bezier(0.2, 0, 0.2, 1) forwards,
        apexShimmer 4s infinite linear;
  }

  .apex-letter--sub {
    font-size: clamp(2.5rem, 8vw, 5rem);
    font-weight: 300;
    background-image: linear-gradient(90deg, #60a5fa, #c084fc, #60a5fa);
    animation: 
        apexLetterIn 1.2s cubic-bezier(0.2, 0, 0.2, 1) forwards,
        apexShimmer 4s infinite linear;
  }

  @keyframes apexLetterIn {
    to {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0);
    }
  }

  @keyframes apexShimmer {
    to { background-position: 200% center; }
  }

  .apex-bar-track {
    width: 300px;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin-top: 40px;
    overflow: hidden;
    position: relative;
  }

  .apex-bar-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    animation: apexBarFill ${VISIBLE_DURATION}ms ease-in-out forwards;
  }

  @keyframes apexBarFill {
    from { width: 0%; }
    to { width: 100%; }
  }

  .apex-tagline {
    margin-top: 24px;
    font-family: system-ui, sans-serif;
    font-weight: 300;
    font-size: 0.75rem;
    color: #64748b;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0;
    animation: fadeIn 1s 1.5s forwards;
  }

  @keyframes fadeIn {
    to { opacity: 1; }
  }
`;