import React, { useEffect, useState, useRef } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Rocket, Target, Globe, Lightbulb } from "lucide-react";
import SEO from "../components/SEO";
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

  // Content visibility
  const [showIntroParagraph, setShowIntroParagraph] = useState(false);
  const [showOfferParagraph, setShowOfferParagraph] = useState(false);
  const [bulletIndex, setBulletIndex] = useState(-1);
  const [showMissionParagraph, setShowMissionParagraph] = useState(false);
  const [showServeParagraph, setShowServeParagraph] = useState(false);

  const [parallaxOffset, setParallaxOffset] = useState(0);

  const scrollToRef = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Improved Typewriter: Handles emojis and ensures smooth character progression
  const typeWriter = (text, setter, onComplete, speed = 50) => {
    let index = 0;
    const chars = Array.from(text);
    setter("");

    const interval = setInterval(() => {
      if (index < chars.length) {
        setter((prev) => prev + chars[index]);
        index++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    const cleanup1 = typeWriter(
      "📚 About Apex Learning",
      setMainHeading,
      () => {
        setShowIntroParagraph(true);
        setTimeout(() => {
          typeWriter(
            "Empowering Students. Simplifying Learning.",
            setIntroHeading,
            () => {
              setShowOfferParagraph(true);
              setTimeout(() => {
                typeWriter("🎯 What We Offer", setOfferHeading, () => {
                  setBulletIndex(0);
                  setTimeout(() => {
                    typeWriter("👩‍🏫 Our Mission", setMissionHeading, () => {
                      setShowMissionParagraph(true);
                      setTimeout(() => {
                        typeWriter("🌍 Who We Serve", setServeHeading, () => {
                          setShowServeParagraph(true);
                        });
                      }, 800);
                    });
                  }, 1500);
                });
              }, 800);
            },
          );
        }, 800);
      },
      600,
    ); // Start delay

    return () => cleanup1 && cleanup1();
  }, []);

  useEffect(() => {
    if (bulletIndex >= 0 && bulletIndex < 4) {
      const timer = setTimeout(() => setBulletIndex((prev) => prev + 1), 500);
      return () => clearTimeout(timer);
    }
  }, [bulletIndex]);

  useEffect(() => {
    const handleScroll = () => setParallaxOffset(window.scrollY * 0.2);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <SEO
        title="About Us | Apex Learning Hub"
        description="Learn more about Apex Learning Hub — Kenya's resource platform for students."
        path="/about"
      />

      <div className="relative min-h-screen flex flex-col items-center bg-[#0b0f1a] overflow-x-hidden text-slate-200 selection:bg-blue-500/30">
        {/* Dynamic Background */}
        <div className="fixed inset-0 z-0">
          <Particles
            id="tsparticles"
            init={particlesInit}
            options={{
              fullScreen: { enable: false },
              background: { color: { value: "transparent" } },
              fpsLimit: 60,
              particles: {
                color: { value: "#3b82f6" },
                links: {
                  color: "#3b82f6",
                  distance: 150,
                  enable: true,
                  opacity: 0.2,
                  width: 1,
                },
                move: { enable: true, speed: 0.8 },
                number: { value: 40, density: { enable: true, area: 800 } },
                size: { value: { min: 1, max: 3 } },
                opacity: { value: 0.3 },
              },
            }}
            className="h-full w-full"
          />
        </div>

        {/* Hero Glow */}
        <div
          className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full z-0 pointer-events-none"
          style={{ transform: `translate(-50%, ${parallaxOffset}px)` }}
        />

        {/* Main Content Container */}
        <div className="relative z-10 w-full max-w-3xl px-6 py-20 flex flex-col gap-16 sm:gap-24">
          {/* Header Section */}
          <section className="text-center space-y-6 animate-fadeIn">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white">
              {mainHeading}
              <span className="text-blue-500 animate-pulse">|</span>
            </h1>
            <h2 className="text-lg sm:text-2xl font-medium text-slate-400 max-w-xl mx-auto leading-relaxed">
              {introHeading}
            </h2>
            {showIntroParagraph && (
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed animate-slideUp">
                Welcome to{" "}
                <span className="text-white font-bold">Apex Learning Hub</span>.
                We are dedicated to bridging the gap between students and the
                resources they need to excel.
              </p>
            )}
          </section>

          {/* Offerings Grid */}
          <section
            className={`grid grid-cols-1 gap-4 transition-all duration-1000 ${showOfferParagraph ? "opacity-100" : "opacity-0"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="text-blue-400" size={28} />
              <h3 className="text-2xl font-bold text-white">{offerHeading}</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Past exam papers with schemes",
                "Verified educator class notes",
                "Latest academic updates",
                "Instant resource downloads",
              ].map((text, i) => (
                <div
                  key={i}
                  className={`p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm transition-all duration-700 ${bulletIndex >= i ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
                >
                  <div className="h-2 w-12 bg-blue-600 rounded-full mb-4" />
                  <p className="text-slate-300 font-medium">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Mission & Vision */}
          <div className="grid sm:grid-cols-2 gap-12">
            <section
              className={`space-y-4 transition-all duration-1000 ${showMissionParagraph ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
            >
              <div className="flex items-center gap-3">
                <Target className="text-rose-400" size={24} />
                <h3 className="text-xl font-bold text-white">Our Mission</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Making learning{" "}
                <span className="text-slate-200 italic">
                  accessible and affordable
                </span>{" "}
                for every student, ensuring quality education is never out of
                reach.
              </p>
            </section>

            <section
              className={`space-y-4 transition-all duration-1000 ${showServeParagraph ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
            >
              <div className="flex items-center gap-3">
                <Globe className="text-emerald-400" size={24} />
                <h3 className="text-xl font-bold text-white">Who We Serve</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                From primary learners to university scholars and educators
                across the region.
              </p>
            </section>
          </div>

          {/* CTA Section */}
          <footer className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10 border-t border-white/5 animate-fadeIn">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-8 py-4 text-slate-400 hover:text-white transition-colors font-bold group"
            >
              <ChevronLeft
                size={20}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Home
            </button>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
            >
              🚀 Start Learning
            </button>
          </footer>
        </div>

        <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 1.2s ease-out forwards; }
        
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-slideUp { animation: slideUp 0.8s ease-out forwards; }
      `}</style>
      </div>
    </>
  );
};

export default AboutUs;
