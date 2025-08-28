// src/pages/Login.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import ReCAPTCHA from "react-google-recaptcha";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const Login = () => {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isRecaptchaVisible, setIsRecaptchaVisible] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [userRole, setUserRole] = useState(null); // ✅ track role

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validateEmail = (email) => {
    const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com", "student.ku.ac.ke"];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const domain = email.split("@")[1];
    return emailRegex.test(email) && allowedDomains.includes(domain);
  };

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) {
      alert("Please enter a valid email from allowed domains.");
      return;
    }
    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    // ✅ Assign role (hardcoded admin email for now)
    if (formData.email === "admin@example.com") {
      setUserRole("admin");
    } else {
      setUserRole("user");
    }

    setIsRecaptchaVisible(true); // show captcha after login
  };

  const onRecaptchaChange = (token) => {
    if (token) {
      alert("✅ Human confirmed!");
      // ✅ Route based on role
      if (userRole === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  };

  const handleGoogleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log("Google user:", decoded);

    // ✅ Role detection example with Google login
    if (decoded.email === "admin@example.com") {
      setUserRole("admin");
    } else {
      setUserRole("user");
    }

    setIsRecaptchaVisible(true); // still go through recaptcha
  };

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
              trail: { delay: 0.005, quantity: 5, particles: { color: { value: "#3b82f6" }, size: { value: 3 } } },
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
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 blur-3xl opacity-30 animate-auraglow"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-gray-900/80 shadow-2xl border border-gray-700 rounded-2xl p-8 space-y-6 text-white backdrop-blur-lg animate-slideUp">
        <h2 className="text-3xl font-extrabold text-center text-blue-400">
          Apex Learning Login
        </h2>
        <p className="text-gray-400 text-center text-sm">
          Sign in to continue your learning journey
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-1">Email</label>
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

          <div className="relative">
            <label className="block text-gray-300 mb-1">Password</label>
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

          <div className="flex justify-between text-sm">
            <a href="/forgot-password" className="text-blue-400 hover:underline">
              Forgot Password?
            </a>
            <a href="/register" className="text-blue-400 hover:underline">
              Register
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/30 transition-transform transform hover:scale-105"
          >
            Login
          </button>

          <div className="text-center text-gray-500 text-sm">or</div>

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

        {isRecaptchaVisible && (
          <div className="mt-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="YOUR_RECAPTCHA_SITE_KEY"
              onChange={onRecaptchaChange}
            />
          </div>
        )}
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.8s ease-out;
        }

        @keyframes auraglow {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          50% { transform: translate(-48%, -52%) rotate(180deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-auraglow {
          top: 50%;
          left: 50%;
          position: absolute;
          transform: translate(-50%, -50%);
          animation: auraglow 12s linear infinite;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default Login;
