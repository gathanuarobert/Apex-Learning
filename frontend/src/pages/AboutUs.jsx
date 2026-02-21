import React, { useEffect, useState, useRef } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  // Typewriter states
  const [mainHeading, setMainHeading] = useState("");
  const [introHeading, setIntroHeading] = useState("");
  const [offerHeading, setOfferHeading] = useState("");
  const [missionHeading, setMissionHeading] = useState("");
  const [serveHeading, setServeHeading] = useState("");

  // Content visibility states
  const [showIntroParagraph, setShowIntroParagraph] = useState(false);
  const [showOfferParagraph, setShowOfferParagraph] = useState(false);
  const [bulletIndex, setBulletIndex] = useState(-1);
  const [showMissionParagraph, setShowMissionParagraph] = useState(false);
  const [showServeParagraph, setShowServeParagraph] = useState(false);

  // CTA Bounce State
  const [bounce, setBounce] = useState(false);

  // Refs for smooth auto-scroll
  const introRef = useRef(null);
  const offerRef = useRef(null);
  const missionRef = useRef(null);
  const serveRef = useRef(null);

  // Parallax state
  const [parallaxOffset, setParallaxOffset] = useState(0);

  const scrollToRef = (ref) => {
    if (ref.current)
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ✅ FIXED typewriter function - properly handles emojis and prevents duplicates
  const typeWriter = (text, setter, onComplete) => {
    let index = 0;
    const chars = Array.from(text); // Split into proper characters (handles emojis correctly)
    
    setter(""); // Clear any existing text
    
    const interval = setInterval(() => {
      if (index < chars.length) {
        const currentText = chars.slice(0, index + 1).join(""); // Build string from scratch each time
        setter(currentText);
        index++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 80);
    
    return () => clearInterval(interval); // Cleanup function
  };

  useEffect(() => {
    const cleanup1 = typeWriter("📚 About Us", setMainHeading, () => {
      setShowIntroParagraph(true);
      setTimeout(() => {
        scrollToRef(introRef);
        const cleanup2 = typeWriter(
          "Empowering Students. Simplifying Learning.",
          setIntroHeading,
          () => {
            setShowOfferParagraph(true);
            setTimeout(() => {
              scrollToRef(offerRef);
              const cleanup3 = typeWriter("🎯 What We Offer", setOfferHeading, () => {
                setBulletIndex(0);
                setTimeout(() => {
                  scrollToRef(missionRef);
                  const cleanup4 = typeWriter("👩‍🏫 Our Mission", setMissionHeading, () => {
                    setShowMissionParagraph(true);
                    setTimeout(() => {
                      scrollToRef(serveRef);
                      const cleanup5 = typeWriter("🌍 Who We Serve", setServeHeading, () => {
                        setShowServeParagraph(true);
                      });
                    }, 1200);
                  });
                }, 2500);
              });
            }, 1200);
          }
        );
      }, 1200);
    });
    
    // Cleanup on unmount
    return () => {
      if (cleanup1) cleanup1();
    };
  }, []);

  useEffect(() => {
    if (bulletIndex >= 0 && bulletIndex < 4) {
      const timer = setTimeout(() => setBulletIndex((prev) => prev + 1), 400);
      return () => clearTimeout(timer);
    }
  }, [bulletIndex]);

  useEffect(() => {
    const handleScroll = () => setParallaxOffset(window.scrollY * 0.3);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setBounce(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleLoginRedirect = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => navigate("/login"), 600);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden text-white">
      {/* Particles Background */}
      <div
        style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
        className="absolute inset-0 z-0 transition-transform duration-100"
      >
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: { color: { value: "#0d1117" } },
            fpsLimit: 120,
            interactivity: {
              events: {
                onHover: { enable: true, mode: "trail" },
                onClick: { enable: true, mode: "push" },
              },
              modes: {
                trail: {
                  delay: 0.005,
                  quantity: 5,
                  particles: { color: { value: "#3b82f6" }, size: { value: 3 } },
                },
                push: { quantity: 4 },
              },
            },
            particles: {
              color: { value: ["#3b82f6", "#60a5fa", "#93c5fd"] },
              links: {
                color: "#3b82f6",
                distance: 120,
                enable: true,
                opacity: 0.4,
                width: 1,
              },
              move: { enable: true, speed: 1, outModes: { default: "bounce" } },
              number: { value: 50, density: { enable: true, area: 800 } },
              opacity: { value: 0.5 },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 4 } },
            },
          }}
        />
      </div>

      {/* Aura Glow */}
      <div
        className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 blur-3xl opacity-30 animate-auraglow"
        style={{
          transform: `translate(-50%, calc(-50% + ${parallaxOffset * 0.4}px))`,
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl text-center px-4 sm:px-6 py-10 sm:py-12 bg-gray-900/80 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-lg animate-slideUp">
        {/* Main Heading */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-400 mb-4 glow-pulse">
          {mainHeading}
          {mainHeading && mainHeading.length < 13 && (
            <span className="border-r-2 border-blue-400 animate-caret"></span>
          )}
        </h1>

        {/* Intro */}
        <div ref={introRef} className="mt-6 animate-slideUp">
          <h2 className="text-xl sm:text-2xl text-blue-300 font-semibold mb-2 glow-pulse">
            {introHeading}
            {introHeading && introHeading.length < 40 && (
              <span className="border-r-2 border-blue-300 animate-caret"></span>
            )}
          </h2>
          {showIntroParagraph && (
            <p className="text-gray-300 max-w-xl sm:max-w-2xl mx-auto animate-fadeIn text-sm sm:text-base">
              Welcome to{" "}
              <span className="font-bold text-blue-400">Apex Learning Hub</span>{" "}
              — your trusted platform for high-quality academic resources. Access
              notes, past papers, and study guides conveniently to enhance your
              learning experience.
            </p>
          )}
        </div>

        {/* What We Offer */}
        <div ref={offerRef} className="mt-8 sm:mt-10 animate-slideUp">
          <h2 className="text-xl sm:text-2xl text-blue-300 font-semibold mb-2 glow-pulse">
            {offerHeading}
            {offerHeading && offerHeading.length < 18 && (
              <span className="border-r-2 border-blue-300 animate-caret"></span>
            )}
          </h2>
          {showOfferParagraph && (
            <ul className="text-gray-400 max-w-xl sm:max-w-2xl mx-auto text-left list-disc list-inside text-sm sm:text-base">
              {[
                "Past exam papers with marking schemes",
                "Downloadable class notes from top-performing educators",
                "Regular updates with the latest academic content",
                "User-friendly platform for fast downloads and easy access",
              ].map((bullet, i) => (
                <li
                  key={i}
                  className={`opacity-0 translate-x-[-10px] transition-all duration-500 ${
                    bulletIndex >= i ? "opacity-100 translate-x-0" : ""
                  }`}
                  style={{
                    transitionDelay: `${i * 200}ms`,
                    display: bulletIndex >= i ? "list-item" : "none",
                  }}
                >
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Mission */}
        <div ref={missionRef} className="mt-8 sm:mt-10 animate-slideUp">
          <h2 className="text-xl sm:text-2xl text-blue-300 font-semibold mb-2 glow-pulse">
            {missionHeading}
            {missionHeading && missionHeading.length < 15 && (
              <span className="border-r-2 border-blue-300 animate-caret"></span>
            )}
          </h2>
          {showMissionParagraph && (
            <p className="text-gray-400 max-w-xl sm:max-w-2xl mx-auto animate-fadeIn text-sm sm:text-base">
              Our mission is to make learning accessible, affordable, and
              effective for students at all levels.
            </p>
          )}
        </div>

        {/* Who We Serve */}
        <div ref={serveRef} className="mt-8 sm:mt-10 animate-slideUp">
          <h2 className="text-xl sm:text-2xl text-blue-300 font-semibold mb-2 glow-pulse">
            {serveHeading}
            {serveHeading && serveHeading.length < 16 && (
              <span className="border-r-2 border-blue-300 animate-caret"></span>
            )}
          </h2>
          {showServeParagraph && (
            <p className="text-gray-400 max-w-xl sm:max-w-2xl mx-auto animate-fadeIn text-sm sm:text-base">
              We serve learners from primary school to university, including
              teachers and institutions seeking reliable study resources. Join
              thousands of students who use{" "}
              <span className="font-bold text-blue-400">
                Apex Learning Hub
              </span>{" "}
              to excel in their studies.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/30 transition-transform transform hover:scale-105 w-full sm:w-auto text-sm sm:text-base"
          >
            ← Back to Home
          </a>
          <button
            onClick={handleLoginRedirect}
            className={`inline-block bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-green-500/30 transition-transform transform hover:scale-110 glow-button w-full sm:w-auto text-sm sm:text-base ${
              bounce ? "animate-bounce-once" : ""
            }`}
          >
            🚀 Go to Login
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 1s ease-in-out forwards; }
        @keyframes auraglow { 0% { transform: translate(-50%, -50%) rotate(0deg); } 50% { transform: translate(-48%, -52%) rotate(180deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
        .animate-auraglow { top: 50%; left: 50%; position: absolute; animation: auraglow 12s linear infinite; z-index: 1; }
        @keyframes caret { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }
        .animate-caret { display: inline-block; width: 2px; margin-left: 4px; animation: caret 1s steps(1) infinite; }
        @keyframes glowPulse { 0%,100% { text-shadow:0 0 10px rgba(59,130,246,0.7),0 0 20px rgba(59,130,246,0.5);}50%{text-shadow:0 0 20px rgba(59,130,246,1),0 0 30px rgba(59,130,246,0.8);} }
        .glow-pulse { animation: glowPulse 2.5s ease-in-out infinite; }
        @keyframes buttonGlow { 0%,100%{box-shadow:0 0 10px rgba(34,197,94,0.6),0 0 20px rgba(34,197,94,0.4);}50%{box-shadow:0 0 20px rgba(34,197,94,0.8),0 0 30px rgba(34,197,94,0.6);} }
        .glow-button { animation: buttonGlow 2s infinite ease-in-out; }
        @keyframes bounceOnce { 0%,20%,50%,80%,100%{transform:translateY(0);}40%{transform:translateY(-8px);}60%{transform:translateY(-4px);} }
        .animate-bounce-once { animation: bounceOnce 1.2s ease-in-out; }
      `}</style>
    </div>
  );
};

export default AboutUs;