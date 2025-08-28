// src/pages/Register.jsx
import React, { useState, useEffect } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { Eye, EyeOff, Info } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const CBC_GRADES = [
  "Pre-Primary 1", "Pre-Primary 2", "Grade 1", "Grade 2", "Grade 3",
  "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8",
  "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];

const EIGHT_FOUR_FOUR_FORMS = ["Form 1", "Form 2", "Form 3", "Form 4"];

const CBC_SUBJECTS = [
  "Mathematics", "English", "Kiswahili", "Science", "Social Studies",
  "Religious Education", "Agriculture", "Computer Studies", "Business Studies",
  "Music", "Art & Craft", "P.E."
];

const EIGHT_FOUR_FOUR_SUBJECTS = [
  "Mathematics", "English", "Kiswahili", "Biology", "Physics",
  "Chemistry", "Geography", "History & Government", "CRE",
  "Agriculture", "Business Studies", "Computer Studies", "Music", "French"
];

const VALID_EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "student.ku.ac.ke", "outlook.com"];

const tooltips = {
  firstName: "Enter your legal first name.",
  middleName: "Optional: add your middle name if applicable.",
  lastName: "Enter your surname/last name.",
  email: `Valid email required (domains: ${VALID_EMAIL_DOMAINS.join(", ")}).`,
  password: "Include upper/lowercase, number & symbol for strong security.",
  confirmPassword: "Must match the password entered above.",
  educationLevel: "CBC is the Competency-Based Curriculum; 8-4-4 is the older system.",
  currentGrade: "Select your current grade or form.",
  teachingLevel: "Choose whether you teach CBC or 8-4-4 curriculum.",
  subject: "Select the subject you teach.",
  childName: "Optional: Enter your child's name to link accounts."
};

const Register = () => {
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    educationLevel: "",
    currentGrade: "",
    teachingLevel: "",
    subject: "",
    childName: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [hoverField, setHoverField] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "" });

  const particlesInit = async (engine) => await loadSlim(engine);
  const subjects = formData.teachingLevel === "CBC" ? CBC_SUBJECTS : EIGHT_FOUR_FOUR_SUBJECTS;

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log("Google Sign-Up Success:", decoded);
  };

  // Password strength calculator
  const calculateStrength = (password) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = ["Weak", "Fair", "Good", "Strong"];
    setPasswordStrength({ score, label: levels[Math.min(score, levels.length - 1)] });
  };

  // Validation
  useEffect(() => {
    Object.keys(formData).forEach((key) => validateField(key, formData[key]));
  }, [formData, role]);

  const validateField = (name, value) => {
    let msg = "";
    const emailDomain = formData.email.split("@")[1];

    switch (name) {
      case "firstName": if (!value.trim()) msg = "First name is required."; break;
      case "lastName": if (!value.trim()) msg = "Last name is required."; break;
      case "email":
        if (!value.trim()) msg = "Email is required.";
        else if (!VALID_EMAIL_DOMAINS.includes(emailDomain)) msg = "Invalid email domain.";
        break;
      case "password":
        if (!value.trim()) msg = "Password is required.";
        else if (value.length < 6) msg = "At least 6 characters.";
        break;
      case "confirmPassword":
        if (value !== formData.password) msg = "Passwords do not match.";
        break;
      case "educationLevel":
        if (role === "student" && !value) msg = "Select education level.";
        break;
      case "currentGrade":
        if (role === "student" && !value) msg = "Select grade/form.";
        break;
      case "teachingLevel":
        if (role === "teacher" && !value) msg = "Select teaching level.";
        break;
      case "subject":
        if (role === "teacher" && !value) msg = "Select subject.";
        break;
      default: break;
    }
    setErrors((prev) => ({ ...prev, [name]: msg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "password") calculateStrength(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!Object.values(errors).some((msg) => msg)) {
      console.log("Register Data:", { role, ...formData });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center text-white overflow-hidden">
      {/* Particles Background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: "#0d1117" } },
          fpsLimit: 120,
          interactivity: { events: { onHover: { enable: true, mode: "trail" }, onClick: { enable: true, mode: "push" } },
            modes: { trail: { delay: 0.005, quantity: 5, particles: { color: { value: "#3b82f6" }, size: { value: 3 } } }, push: { quantity: 4 } }
          },
          particles: { color: { value: ["#3b82f6", "#60a5fa", "#93c5fd"] }, links: { color: "#3b82f6", distance: 120, enable: true, opacity: 0.4, width: 1 }, move: { enable: true, speed: 1, outModes: { default: "bounce" } }, number: { value: 50, density: { enable: true, area: 800 } }, opacity: { value: 0.5 }, shape: { type: "circle" }, size: { value: { min: 1, max: 4 } } }
        }}
        className="absolute inset-0 z-0"
      />

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-3xl bg-gray-900/90 p-8 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-lg animate-slideUp">
        <h1 className="text-3xl font-extrabold text-center mb-6 text-blue-400">Create Your Account</h1>

        {/* Role Selector */}
        <div className="flex justify-around mb-6">
          {["student", "teacher", "parent", "public"].map((r) => (
            <label key={r} className="cursor-pointer">
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="hidden" />
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${role === r ? "bg-blue-600 shadow-md" : "bg-gray-700 hover:bg-gray-600"}`}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </span>
            </label>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Floating Inputs */}
          {["firstName", "middleName", "lastName", "email", "password", "confirmPassword"].map((field) => (
            <div key={field} className="relative group">
              <input
                type={field.includes("password") ? (field === "confirmPassword" && showConfirm ? "text" : field === "password" && showPassword ? "text" : "password") : field === "email" ? "email" : "text"}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                onFocus={() => setHoverField(field)}
                onBlur={() => setHoverField(null)}
                className="peer w-full px-3 pt-5 pb-2 rounded-lg bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder=" "
              />
              <label className="absolute left-3 top-2 text-gray-400 text-xs peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-sm transition-all">
                {field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
              </label>
              {field.includes("password") && (
                <span className="absolute right-3 top-4 cursor-pointer" onClick={() => field === "password" ? setShowPassword(!showPassword) : setShowConfirm(!showConfirm)}>
                  {field === "password" ? (showPassword ? <EyeOff size={18} /> : <Eye size={18} />) : (showConfirm ? <EyeOff size={18} /> : <Eye size={18} />)}
                </span>
              )}
              {hoverField === field && tooltips[field] && (
                <div className="absolute top-full mt-1 left-0 bg-gray-800 text-gray-200 text-xs px-3 py-1 rounded shadow-lg border border-gray-700 animate-fadeIn">
                  <Info size={12} className="inline mr-1" /> {tooltips[field]}
                </div>
              )}
              {errors[field] && <p className="text-red-400 text-xs mt-1">{errors[field]}</p>}

              {/* Password Strength Meter */}
              {field === "password" && formData.password && (
                <div className="mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        passwordStrength.score <= 1 ? "bg-red-500 w-1/4" :
                        passwordStrength.score === 2 ? "bg-yellow-500 w-2/4" :
                        passwordStrength.score === 3 ? "bg-blue-500 w-3/4" :
                        "bg-green-500 w-full"
                      }`}
                    ></div>
                  </div>
                  <p className={`text-xs mt-1 ${
                    passwordStrength.score <= 1 ? "text-red-400" :
                    passwordStrength.score === 2 ? "text-yellow-400" :
                    passwordStrength.score === 3 ? "text-blue-400" :
                    "text-green-400"
                  }`}>
                    {passwordStrength.label} Password
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Student Fields */}
          {role === "student" && (
            <>
              <div className="relative">
                <select name="educationLevel" value={formData.educationLevel} onChange={handleChange} className="peer w-full px-3 pt-5 pb-2 rounded-lg bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Education Level</option>
                  <option value="CBC">CBC</option>
                  <option value="8-4-4">8-4-4</option>
                </select>
                <label className="absolute left-3 top-2 text-gray-400 text-xs">Education Level</label>
              </div>
              <div className="relative">
                <select name="currentGrade" value={formData.currentGrade} onChange={handleChange} className="peer w-full px-3 pt-5 pb-2 rounded-lg bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Current Grade/Form</option>
                  {(formData.educationLevel === "CBC" ? CBC_GRADES : EIGHT_FOUR_FOUR_FORMS).map((lvl) => <option key={lvl}>{lvl}</option>)}
                </select>
                <label className="absolute left-3 top-2 text-gray-400 text-xs">Current Grade/Form</label>
              </div>
            </>
          )}

          {/* Teacher Fields */}
          {role === "teacher" && (
            <>
              <div className="relative">
                <select name="teachingLevel" value={formData.teachingLevel} onChange={handleChange} className="peer w-full px-3 pt-5 pb-2 rounded-lg bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Teaching Level</option>
                  <option value="CBC">CBC</option>
                  <option value="8-4-4">8-4-4</option>
                </select>
                <label className="absolute left-3 top-2 text-gray-400 text-xs">Teaching Level</label>
              </div>
              <div className="relative">
                <select name="subject" value={formData.subject} onChange={handleChange} className="peer w-full px-3 pt-5 pb-2 rounded-lg bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Subject</option>
                  {subjects.map((subj) => <option key={subj}>{subj}</option>)}
                </select>
                <label className="absolute left-3 top-2 text-gray-400 text-xs">Subject</label>
              </div>
            </>
          )}

          {/* Parent Field */}
          {role === "parent" && (
            <div className="relative">
              <input type="text" name="childName" value={formData.childName} onChange={handleChange} placeholder=" " className="peer w-full px-3 pt-5 pb-2 rounded-lg bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" />
              <label className="absolute left-3 top-2 text-gray-400 text-xs">Child's Name (Optional)</label>
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold transition-all">
            Register
          </button>
        </form>

        {/* Google Sign-Up */}
        <div className="mt-6 flex justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => console.log("Google Sign-Up Failed")} shape="pill" theme="filled_blue" text="signup_with" />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
        @keyframes slideUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.8s ease-out; }
      `}</style>
    </div>
  );
};

export default Register;
