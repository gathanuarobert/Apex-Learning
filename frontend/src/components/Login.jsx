// src/pages/Login.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import ReCAPTCHA from "react-google-recaptcha";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { loginUser } from "../Api";

const Login = () => {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [showPassword, setShowPassword]   = useState(false);
  const [formData, setFormData]           = useState({ email: "", password: "" });
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [loading, setLoading]             = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validateEmail = (email) => {
    const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com", "student.ku.ac.ke"];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const domain = email.split("@")[1];
    return emailRegex.test(email) && allowedDomains.includes(domain);
  };

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      alert("Please enter a valid email from allowed domains.");
      return;
    }
    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    if (!recaptchaToken) {
      alert("Please complete the reCAPTCHA.");
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser({
        ...formData,
        recaptcha: recaptchaToken,
      });

      // ✅ Tokens are now in HttpOnly cookies set by the backend.
      // We only use the user object from the response body for navigation.
      const user = response.data.user;

      if (user.is_superuser || user.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Login failed. Check your credentials.");

      // Reset reCAPTCHA after failed attempt
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setRecaptchaToken("");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log("Google user:", decoded);
    const role = decoded.email === "admin@example.com" ? "admin" : "user";
    navigate(role === "admin" ? "/admin-dashboard" : "/dashboard");
  };

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
      {/* Particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 z-0"
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
            links: { color: "#3b82f6", distance: 120, enable: true, opacity: 0.4, width: 1 },
            move: { enable: true, speed: 1, outModes: { default: "bounce" } },
            number: { value: 50, density: { enable: true, area: 800 } },
            opacity: { value: 0.5 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 4 } },
          },
        }}
      />

      {/* Aura Glow */}
      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 blur-3xl opacity-30 animate-auraglow"></div>

      {/* Back to Home Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
      >
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="hidden sm:inline">Back to Home</span>
      </button>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-gray-900/80 shadow-2xl border border-gray-700 rounded-2xl p-6 sm:p-8 space-y-6 text-white backdrop-blur-lg animate-slideUp">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-400">Welcome Back!</h2>
          <p className="text-gray-400 text-sm mt-2">Sign in to continue your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-gray-300 mb-1 text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-gray-300 mb-1 text-sm font-medium">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute top-9 right-3 text-blue-400 hover:text-blue-300 transition"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-blue-400 hover:text-blue-300 transition hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* reCAPTCHA */}
          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setRecaptchaToken(token)}
            />
          </div>

          {/* Submit */}
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
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900/80 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Login */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => alert("Google login failed")}
              theme="filled_black"
              shape="pill"
              text="signin_with"
            />
          </div>
        </form>

        <div className="text-center space-y-2">
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors hover:underline"
            >
              Sign up here
            </button>
          </p>
          <p className="text-gray-500 text-xs">
            Join thousands of students learning with Apex Learning Hub
          </p>
        </div>
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

export default Login;