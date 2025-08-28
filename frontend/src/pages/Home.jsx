import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Import images from assets so Vite bundles them
import scholar1 from "../assets/images/scholar1.jpg";
import scholar2 from "../assets/images/scholar2.jpg";
import scholar3 from "../assets/images/scholar3.jpg";

const images = [scholar1, scholar2, scholar3];

const Home = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  // Auto-slide carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Swipe detection for mobile
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      setCurrentIndex((prevIndex) =>
        diff > 0 ? (prevIndex + 1) % images.length : (prevIndex - 1 + images.length) % images.length
      );
    }
  };

  return (
    <div
      className="relative min-h-screen w-full text-white overflow-hidden bg-gray-900"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Carousel with Blur Fallback */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 blur-sm scale-105"
        style={{ backgroundImage: `url(${images[currentIndex]})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-gray-900"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none z-5">
        {[...Array(25)].map((_, i) => (
          <span
            key={i}
            className="absolute bg-white rounded-full opacity-20"
            style={{
              width: `${Math.random() * 6 + 4}px`,
              height: `${Math.random() * 6 + 4}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${6 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

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
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-wide text-white drop-shadow-xl animate-fadeIn">
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
        <div className="flex gap-6 mt-10">
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-700 text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg hover:scale-110 hover:shadow-blue-500 transition-transform duration-300"
          >
            Get Started
          </button>
          <button
            onClick={() => navigate("/about")}
            className="bg-green-700 text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg hover:scale-110 hover:shadow-green-500 transition-transform duration-300"
          >
            Learn More
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="bg-purple-700 text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg hover:scale-110 hover:shadow-purple-500 transition-transform duration-300"
          >
            Contact Us
          </button>
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center mt-8 space-x-3">
          {images.map((_, index) => (
            <span
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`cursor-pointer w-4 h-4 rounded-full transition-all duration-300 ${
                currentIndex === index ? "bg-white scale-125" : "bg-white/40 hover:bg-white"
              }`}
            ></span>
          ))}
        </div>
      </main>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 1s ease-out forwards; }

        @keyframes float { 0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; } 
                           50% { transform: translateY(-20px) translateX(10px); opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default Home;
