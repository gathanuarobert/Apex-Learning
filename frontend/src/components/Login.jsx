// src/pages/Login.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {jwtDecode} from "jwt-decode";
import ReCAPTCHA from "react-google-recaptcha";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { loginUser } from "../Api"; // ✅ import login API

const Login = () => {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isRecaptchaVisible, setIsRecaptchaVisible] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validateEmail = (email) => {
    const allowedDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "student.ku.ac.ke",
    ];
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

    try {
      // ✅ Call Django backend login
      const response = await loginUser(formData);
      const data = response.data;

      // Example: backend returns { token, user: { email, role } }
      const user = data.user;
      const userToken = data.token;
      setToken(userToken);

      setUserRole(user.role); // dynamically set role from backend
      setIsRecaptchaVisible(true); // show captcha after successful login
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.detail || "Login failed. Check your credentials."
      );
    }
  };

  const onRecaptchaChange = (token) => {
    if (token) {
      alert("✅ Human confirmed!");
      // Navigate based on role from backend
      if (userRole === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log("Google user:", decoded);

    // You can call your backend to create/login the user here
    // Example: await loginWithGoogle(decoded.email);

    setUserRole(decoded.email === "admin@example.com" ? "admin" : "user");
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
            events: { onHover: { enable: true, mode: "trail" }, onClick: { enable: true, mode: "push" } },
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
    </div>
  );
};

export default Login;
