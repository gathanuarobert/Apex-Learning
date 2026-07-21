import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import api, { getCurrentUser } from "../Api";
import { Helmet } from "react-helmet-async";

const Home = () => {
  const navigate = useNavigate();
  const [loadingUser, setLoadingUser] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getCurrentUser(token)
        .then((res) => {
          if (res.data) {
            setShowToast(true);
            setTimeout(() => navigate("/dashboard"), 2000);
          }
        })
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoadingUser(false));
    } else setLoadingUser(false);
  }, [navigate]);

  const particlesInit = async (engine) => await loadSlim(engine);

  const particleOptions = {
    fullScreen: { enable: false }, // Critical: keeps particles inside the container
    fpsLimit: 120,
    interactivity: {
      events: {
        onHover: { enable: true, mode: "repulse" },
        resize: true,
      },
      modes: { repulse: { distance: 100, duration: 0.4 } },
    },
    particles: {
      number: {
        value: 40,
        density: { enable: true, area: 800 },
      },
      color: { value: ["#FDE047", "#22D3EE", "#A78BFA"] },
      opacity: {
        value: 0.5, // Increased visibility
        random: true,
      },
      size: { value: { min: 1, max: 3 } },
      move: {
        enable: true,
        speed: 0.6,
        direction: "none",
        outModes: { default: "out" },
      },
      links: {
        enable: true,
        distance: 150,
        color: "#ffffff",
        opacity: 0.2,
        width: 1,
      },
    },
    detectRetina: true,
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="animate-pulse font-bold">Loading Apex Learning...</div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Apex Learning Hub | Notes, Exams & Past Papers"
        description="Download notes, exams and past papers for Kenyan students. KCSE and primary school resources."
        path="/"
      />

      <div className="relative min-h-screen w-full text-white bg-gray-950 overflow-x-hidden">
        {/* 1. Fix: Particles Layer */}
        <div className="absolute inset-0 z-0">
          <Particles
            id="tsparticles"
            init={particlesInit}
            options={particleOptions}
            className="h-full w-full"
          />
        </div>

        {/* 2. Fix: Gradient Overlay (Below text, above particles) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-[1] pointer-events-none"></div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 px-6 py-3 bg-blue-700 text-white rounded-xl shadow-2xl border border-white/20 animate-fadeInOut text-center sm:text-left">
            Redirecting to dashboard...
          </div>
        )}

        {/* Header */}
        <header className="relative z-20 w-full flex items-center justify-center sm:justify-between px-8 py-6">
          <div
            onClick={() => navigate("/")}
            className="text-2xl sm:text-3xl font-black cursor-pointer tracking-tighter hover:text-blue-400 transition-colors"
          >
            APEX <span className="text-blue-500">LEARNING</span>
          </div>
        </header>

        {/* Hero Content */}
        <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-10 pb-20 min-h-[80vh]">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none animate-fadeIn">
            ELEVATE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              KNOWLEDGE
            </span>
          </h1>

          <p className="mt-8 text-lg md:text-xl text-gray-400 font-medium max-w-2xl animate-fadeIn [animation-delay:200ms]">
            Tailored learning for <span className="text-white">CBC</span>,{" "}
            <span className="text-white">8-4-4</span>, and{" "}
            <span className="text-white">University</span> students.
          </p>

          {/* Action Buttons - Stack on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row gap-4 mt-12 w-full max-w-md sm:max-w-none justify-center animate-fadeIn [animation-delay:400ms]">
            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-full px-10 py-4 text-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/20"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/about")}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 rounded-full px-10 py-4 text-lg font-bold transition-all hover:scale-105"
            >
              Learn More
            </button>
          </div>

          <p className="mt-16 max-w-xl text-gray-500 italic text-sm sm:text-base animate-fadeIn [animation-delay:600ms]">
            "Education is the passport to the future..." — Malcolm X
          </p>
        </main>

        <style>{`
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(30px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes fadeInOut { 
          0% { opacity: 0; transform: translateY(-20px); } 
          15% { opacity: 1; transform: translateY(0); } 
          85% { opacity: 1; transform: translateY(0); } 
          100% { opacity: 0; transform: translateY(-20px); } 
        }
        .animate-fadeInOut { animation: fadeInOut 3s ease-in-out forwards; }
      `}</style>
      </div>
    </>
  );
};

export default Home;
