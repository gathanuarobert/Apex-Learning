// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import api, { getCurrentUser } from "../Api";

const Home = () => {
  const navigate = useNavigate();
  const [loadingUser, setLoadingUser] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // Check if user is logged in
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

  // Particle initialization
  const particlesInit = async (engine) => await loadSlim(engine);
  const particleCount = window.innerWidth < 768 ? 15 : 35; // more particles on desktop

  const particleOptions = {
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: { enable: true, mode: "repulse" },
        resize: true,
      },
      modes: { repulse: { distance: 100, duration: 0.4 } },
    },
    particles: {
      number: { value: particleCount, density: { enable: true, area: 800 } },
      color: { value: ["#FDE047", "#22D3EE", "#A78BFA"] },
      opacity: { value: 0.25, random: { enable: true, minimumValue: 0.1 } },
      size: { value: { min: 2, max: 5 }, random: true },
      move: {
        enable: true,
        speed: 0.4,
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "out" },
        attract: { enable: true, rotateX: 600, rotateY: 600 },
      },
      links: {
        enable: true,
        distance: 130,
        color: "#ffffff",
        opacity: 0.1,
        width: 1,
      },
    },
    detectRetina: true,
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full text-white overflow-hidden bg-gray-900">

      {/* Interactive Particles */}
      <Particles id="tsparticles" init={particlesInit} options={particleOptions} className="absolute inset-0 -z-10" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-gray-900"></div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 right-8 z-50 px-6 py-3 bg-blue-700 text-white rounded-xl shadow-lg backdrop-blur-sm border border-white/20 animate-fadeInOut">
          You are already logged in. Redirecting to your dashboard...
        </div>
      )}

      {/* Header */}
      <header className="absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-20">
        <div
          onClick={() => navigate("/about")}
          className="text-4xl font-extrabold cursor-pointer tracking-wide text-white drop-shadow-lg hover:scale-105 transition-transform"
        >
          APEX LEARNING
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative flex flex-col items-center justify-center text-center min-h-screen z-10 px-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold tracking-wide text-white drop-shadow-xl animate-fadeIn">
          APEX LEARNING
        </h1>
        <p className="mt-5 text-xl md:text-2xl text-gray-300 font-medium animate-fadeIn delay-200">
          CBC <span className="text-blue-400">|</span> 8-4-4 <span className="text-blue-400">|</span> UNIVERSITY
        </p>
        <p className="mt-6 max-w-3xl text-gray-400 italic text-lg leading-relaxed animate-fadeIn delay-400">
          "Education is the passport to the future, for tomorrow belongs to those who prepare for it today."
          <br /> – Malcolm X
        </p>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-6 mt-10 ${showToast ? "animate-buttonPulse" : ""}`}>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-700 text-white rounded-full px-8 py-3 sm:px-6 sm:py-2 text-lg font-semibold shadow-lg hover:scale-110 hover:shadow-blue-500 transition-transform duration-300"
          >
            Get Started
          </button>
          <button
            onClick={() => navigate("/about")}
            className="bg-green-700 text-white rounded-full px-8 py-3 sm:px-6 sm:py-2 text-lg font-semibold shadow-lg hover:scale-110 hover:shadow-green-500 transition-transform duration-300"
          >
            Learn More
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="bg-purple-700 text-white rounded-full px-8 py-3 sm:px-6 sm:py-2 text-lg font-semibold shadow-lg hover:scale-110 hover:shadow-purple-500 transition-transform duration-300"
          >
            Contact Us
          </button>
        </div>
      </main>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 1s ease-out forwards; }
        @keyframes fadeInOut { 0% { opacity: 0; transform: translateY(-10px); } 
                               10% { opacity: 1; transform: translateY(0); } 
                               90% { opacity: 1; transform: translateY(0); } 
                               100% { opacity: 0; transform: translateY(-10px); } }
        .animate-fadeInOut { animation: fadeInOut 3s ease-in-out forwards; }
        @keyframes buttonPulse { 0%,100%{transform:scale(1); box-shadow:0 0 0px rgba(255,255,255,0);} 50%{transform:scale(1.05); box-shadow:0 0 15px rgba(255,255,255,0.3);} }
        .animate-buttonPulse { animation: buttonPulse 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Home;
