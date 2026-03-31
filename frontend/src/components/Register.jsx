import React, { useState } from "react";
import Particles from "react-tsparticles";
import ReCAPTCHA from "react-google-recaptcha";
import { loadSlim } from "tsparticles-slim";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import * as api from "../Api";

const CBC_GRADES        = ["Pre-Primary 1", "Pre-Primary 2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const EIGHT_FOUR_FOUR_FORMS = ["Form 1", "Form 2", "Form 3", "Form 4"];

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole]                   = useState("student");
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "", middleName: "", lastName: "", email: "",
    password: "", confirmPassword: "", educationLevel: "",
    currentGrade: "", teachingLevel: "", subject: "", childName: "",
  });

  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "" });
  const [recaptchaToken, setRecaptchaToken] = useState("");

  const particlesInit = async (engine) => await loadSlim(engine);

  const particleOptions = {
    fullScreen: { enable: false },
    fpsLimit: 120,
    interactivity: {
      events: { onHover: { enable: true, mode: "repulse" }, resize: true },
      modes:  { repulse: { distance: 100, duration: 0.4 } },
    },
    particles: {
      number:  { value: 40, density: { enable: true, area: 800 } },
      color:   { value: ["#FDE047", "#22D3EE", "#A78BFA"] },
      opacity: { value: 0.5, random: true },
      size:    { value: { min: 1, max: 3 } },
      move:    { enable: true, speed: 0.6, direction: "none", outModes: { default: "out" } },
      links:   { enable: true, distance: 150, color: "#ffffff", opacity: 0.2, width: 1 },
    },
    detectRetina: true,
  };

  const calculateStrength = (password) => {
    let score = 0;
    if (password.length >= 6)          score++;
    if (/[A-Z]/.test(password))        score++;
    if (/[0-9]/.test(password))        score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const levels = ["Weak", "Fair", "Good", "Strong"];
    setPasswordStrength({ score, label: levels[Math.min(score, 3)] });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "password") calculateStrength(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!recaptchaToken) {
      alert("Please complete the reCAPTCHA.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullName = [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(" ");

      const userData = {
        name:      fullName,
        email:     formData.email,
        password:  formData.password,
        role:      role,
        recaptcha: recaptchaToken,
      };

      if (role === "student") userData.student_profile = { grade: formData.currentGrade };
      else if (role === "teacher") userData.teacher_profile = { subject: formData.subject };

      // ✅ Register — backend now sets HttpOnly cookies AND returns user data.
      // No localStorage needed.
      const response = await api.registerUser(userData);
      const user = response.data.user;

      setRegisterSuccess(true);
      setTimeout(() => {
        if (user?.is_superuser || user?.role === "admin") {
          navigate("/dashboard");
        } else {
          navigate("/user-dashboard");
        }
      }, 1500);

    } catch (err) {
      console.error("Registration Error:", err);
      alert(
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        "Registration failed."
      );

      // Reset reCAPTCHA — token is now invalid/used
      if (window.grecaptcha) window.grecaptcha.reset();
      setRecaptchaToken("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-950 p-4 sm:p-6 overflow-x-hidden">

      {/* Background Particles */}
      <div className="absolute inset-0 z-0">
        <Particles id="tsparticles" init={particlesInit} options={particleOptions} className="h-full w-full" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row">

        {/* Left Branding Panel */}
        <div className="hidden md:flex w-1/3 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-10 flex-col justify-between text-white">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">APEX</h2>
            <p className="text-blue-100/70 mt-3 text-sm leading-relaxed">
              Unlock your potential with Kenya's leading learning management system.
            </p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="bg-white/10 p-2 rounded-lg"><CheckCircle2 size={20} className="text-blue-300" /></div>
              Interactive Content
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="bg-white/10 p-2 rounded-lg"><CheckCircle2 size={20} className="text-blue-300" /></div>
              Exam Preparation
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 p-6 sm:p-12 text-white">
          {registerSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
              <div className="bg-green-500/20 p-6 rounded-full">
                <CheckCircle2 size={80} className="text-green-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Registration Successful!</h2>
                <p className="text-gray-400 mt-2">Setting up your personalized dashboard...</p>
              </div>
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <>
              <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl font-bold">Create Account</h1>
                <p className="text-gray-400 mt-2">Join Apex Learning today.</p>
              </div>

              {/* Role Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
                {["student", "teacher", "parent", "public"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${
                      role === r
                        ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40"
                        : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input name="firstName" placeholder="First Name" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  <input name="lastName"  placeholder="Last Name"  onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                </div>

                <input type="email" name="email" placeholder="Email Address" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />

                {/* Password */}
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-4 text-gray-500 hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="flex gap-1 px-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div key={step} className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.score >= step ? "bg-blue-500" : "bg-white/10"}`} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-5 top-4 text-gray-500 hover:text-white transition-colors">
                    {showConfirm ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>

                {/* Student grade selector */}
                {role === "student" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select name="educationLevel" onChange={handleChange} className="bg-gray-800 text-sm border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Curriculum</option>
                      <option value="CBC">CBC</option>
                      <option value="8-4-4">8-4-4</option>
                    </select>
                    <select name="currentGrade" onChange={handleChange} className="bg-gray-800 text-sm border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Current Grade/Form</option>
                      {(formData.educationLevel === "CBC" ? CBC_GRADES : EIGHT_FOUR_FOUR_FORMS).map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-center py-4 scale-90 sm:scale-100 overflow-hidden">
                  <ReCAPTCHA sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={setRecaptchaToken} theme="dark" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !recaptchaToken}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Sign Up"}
                </button>
              </form>

              <div className="mt-10 space-y-6">
                <div className="relative flex items-center justify-center">
                  <span className="absolute inset-x-0 h-px bg-white/10"></span>
                  <span className="relative bg-[#161b22] px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Or Secure Sign Up With</span>
                </div>
                <div className="flex justify-center">
                  <GoogleLogin onSuccess={() => {}} theme="filled_blue" shape="pill" size="large" />
                </div>
                <p className="text-center text-gray-500 text-sm">
                  Already have an account?{" "}
                  <button onClick={() => navigate("/login")} className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
                    Log In
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;