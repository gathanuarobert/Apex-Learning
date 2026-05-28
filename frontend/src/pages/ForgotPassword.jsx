import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import api from "../Api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("users/forgot-password/", { email });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 z-0"
        options={{
          background: { color: { value: "#0d1117" } },
          fpsLimit: 120,
          particles: {
            color: { value: ["#3b82f6", "#60a5fa", "#93c5fd"] },
            links: { color: "#3b82f6", distance: 120, enable: true, opacity: 0.4, width: 1 },
            move: { enable: true, speed: 1, outModes: { default: "bounce" } },
            number: { value: 50, density: { enable: true, area: 800 } },
            opacity: { value: 0.5 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 4 } },
          },
        }}
      />

      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 blur-3xl opacity-30 animate-auraglow" />

      {/* Back button */}
      <button
        onClick={() => navigate("/login")}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
      >
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="hidden sm:inline">Back to Login</span>
      </button>

      <div className="relative z-10 w-full max-w-md bg-gray-900/80 shadow-2xl border border-gray-700 rounded-2xl p-6 sm:p-8 space-y-6 text-white backdrop-blur-lg animate-slideUp">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-400">Forgot Password?</h2>
          <p className="text-gray-400 text-sm mt-2">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">📧</div>
            <p className="text-green-400 font-medium">Reset link sent!</p>
            <p className="text-gray-400 text-sm">
              If that email is registered, you'll receive a link shortly. Check your inbox (and spam folder).
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <div>
              <label className="block text-gray-300 mb-1 text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/30 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.8s ease-out; }
        @keyframes auraglow {
          0%   { transform: translate(-50%, -50%) rotate(0deg); }
          50%  { transform: translate(-48%, -52%) rotate(180deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-auraglow {
          top: 50%; left: 50%; position: absolute;
          animation: auraglow 12s linear infinite; z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;