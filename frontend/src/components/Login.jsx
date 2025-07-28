// src/pages/Login.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {jwtDecode} from "jwt-decode";
import ReCAPTCHA from "react-google-recaptcha";

const Login = () => {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isRecaptchaVisible, setIsRecaptchaVisible] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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
      alert("Please enter a valid email address from allowed domains.");
      return;
    }

    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    setIsRecaptchaVisible(true);
  };

  const onRecaptchaChange = (token) => {
    if (token) {
      alert("Login successful!");
      navigate("/dashboard"); // Redirect after CAPTCHA passes
    }
  };

  const handleGoogleLoginSuccess = (credentialResponse) => {
    const decoded = jwt_decode(credentialResponse.credential);
    console.log("Google user:", decoded);
    alert("Google login successful!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-center text-blue-700">Apex Learning Login</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="you@example.com"
            />
          </div>

          <div className="relative">
            <label className="block text-gray-700">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your password"
              minLength={8}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute top-9 right-3 text-blue-500"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Forgot Password?
            </a>
            <a href="/register" className="text-sm text-blue-600 hover:underline">
              Register
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Login
          </button>

          <div className="text-center text-sm text-gray-500">or</div>

          <div className="flex items-center justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => alert("Google login failed")}
              theme="outline"
              shape="pill"
              text="signin_with"
              useOneTap
              auto_select
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
